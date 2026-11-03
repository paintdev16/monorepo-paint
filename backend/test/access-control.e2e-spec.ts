import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// TEST_DATABASE_URL must point to an isolated, migrated database with the RBAC seed applied.
describe.skipIf(!process.env.TEST_DATABASE_URL)('RBAC with PostgreSQL', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: string;
  let userId: string;
  let token: string;
  let userToken: string;
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const password = 'a-strong-test-password';
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    const adminEmail = `admin-${suffix}@example.com`;
    const userEmail = `user-${suffix}@example.com`;
    adminId = (await request(app.getHttpServer()).post('/auth/register').send({ email: adminEmail, password, name: 'Admin' }).expect(201)).body.id as string;
    userId = (await request(app.getHttpServer()).post('/auth/register').send({ email: userEmail, password, name: 'User' }).expect(201)).body.id as string;
    const role = await prisma.db.orm.public.Role.where({ name: 'super_admin' }).first();
    if (!role) throw new Error('Run rbac:seed on the test database first');
    await prisma.db.orm.public.UserRole.create({ id: randomUUID(), userId: adminId, roleId: role.id });
    token = (await request(app.getHttpServer()).post('/auth/login').send({ email: adminEmail, password }).expect(200)).body.accessToken as string;
    userToken = (await request(app.getHttpServer()).post('/auth/login').send({ email: userEmail, password }).expect(200)).body.accessToken as string;
  });
  afterAll(async () => {
    if (prisma && adminId) await prisma.db.orm.public.User.where({ id: adminId }).deleteAndCount();
    if (prisma && userId) await prisma.db.orm.public.User.where({ id: userId }).deleteAndCount();
    await app?.close();
  });
  it('enforces JWT and permissions and reflects assignments and revocations immediately', async () => {
    await request(app.getHttpServer()).get('/roles').expect(401);
    await request(app.getHttpServer()).get('/roles').auth(userToken, { type: 'bearer' }).expect(403);
    await request(app.getHttpServer()).get('/users').expect(401);
    await request(app.getHttpServer()).get('/users').auth(userToken, { type: 'bearer' }).expect(403);
    await request(app.getHttpServer()).get(`/users?search=${suffix}`).auth(token, { type: 'bearer' }).expect(200).expect(({ body }) => {
      expect(body.total).toBe(2);
      expect(body.data).toHaveLength(2);
      expect(body.data[0]).not.toHaveProperty('passwordHash');
      expect(body.data.find((user: { id: string }) => user.id === adminId).roles).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'super_admin' })]));
    });
    const role = (await request(app.getHttpServer()).post('/roles').auth(token, { type: 'bearer' }).send({ name: `test_${suffix}` }).expect(201)).body;
    const all = (await request(app.getHttpServer()).get('/permissions?limit=100').auth(token, { type: 'bearer' }).expect(200)).body.data as { id: string; key: string }[];
    const permission = all.find((value) => value.key === 'roles.view')!;
    await request(app.getHttpServer()).put(`/roles/${role.id}/permissions`).auth(token, { type: 'bearer' }).send({ ids: [permission.id] }).expect(200);
    await request(app.getHttpServer()).put(`/users/${userId}/roles`).auth(token, { type: 'bearer' }).send({ ids: [role.id] }).expect(200);
    await request(app.getHttpServer()).get(`/roles?search=${role.name}`).auth(token, { type: 'bearer' }).expect(200).expect(({ body }) => {
      expect(body.total).toBe(1);
      expect(body.data[0]).toMatchObject({ userCount: 1, permissionCount: 1 });
    });
    await request(app.getHttpServer()).get('/permissions?resource=roles').auth(token, { type: 'bearer' }).expect(200).expect(({ body }) => {
      expect(body.data.every((entry: { key: string }) => entry.key.startsWith('roles.'))).toBe(true);
      expect(body.data.find((entry: { id: string }) => entry.id === permission.id).roleCount).toBeGreaterThanOrEqual(1);
    });
    await request(app.getHttpServer()).get('/roles').auth(userToken, { type: 'bearer' }).expect(200);
    await request(app.getHttpServer()).post('/roles').auth(userToken, { type: 'bearer' }).send({ name: 'escalated' }).expect(403);
    await request(app.getHttpServer()).put(`/roles/${role.id}/permissions`).auth(token, { type: 'bearer' }).send({ ids: [] }).expect(200);
    await request(app.getHttpServer()).get('/roles').auth(userToken, { type: 'bearer' }).expect(403);
    await request(app.getHttpServer()).put(`/users/${userId}/roles`).auth(token, { type: 'bearer' }).send({ ids: [] }).expect(200);
    await request(app.getHttpServer()).delete(`/roles/${role.id}`).auth(token, { type: 'bearer' }).expect(204);
  });
});
