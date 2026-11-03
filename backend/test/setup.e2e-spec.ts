import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// This database must be dedicated to this test, empty of users, migrated and seeded.
describe.skipIf(!process.env.TEST_SETUP_DATABASE_URL)('initial setup with PostgreSQL', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdId: string | undefined;
  const input = { email: 'setup-test@example.com', name: 'Setup', password: 'a-secure-password-123' };
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
    process.env.DATABASE_URL = process.env.TEST_SETUP_DATABASE_URL;
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    if (await prisma.db.orm.public.User.first()) throw new Error('TEST_SETUP_DATABASE_URL must contain no users');
  });
  afterAll(async () => {
    if (createdId) await prisma.db.orm.public.User.where({ id: createdId }).deleteAndCount();
    await app?.close();
  });
  it('serializes initial requests, assigns the role and prevents repeated setup', async () => {
    await request(app.getHttpServer()).get('/auth/setup').expect(200).expect(({ body }) => expect(body.setupRequired).toBe(true));
    await request(app.getHttpServer()).post('/auth/register').send(input).expect(409);
    const attempts = await Promise.all([request(app.getHttpServer()).post('/auth/setup').send(input), request(app.getHttpServer()).post('/auth/setup').send({ ...input, email: 'other@example.com' })]);
    expect(attempts.map((response) => response.status).sort((a, b) => a - b)).toEqual([201, 409]);
    createdId = attempts.find((response) => response.status === 201)!.body.id as string;
    const superRole = await prisma.db.orm.public.Role.where({ name: 'super_admin' }).first();
    expect(superRole).not.toBeNull();
    expect(await prisma.db.orm.public.UserRole.where({ userId: createdId, roleId: superRole!.id }).first()).not.toBeNull();
    await request(app.getHttpServer()).get('/auth/setup').expect(200).expect(({ body }) => expect(body.setupRequired).toBe(false));
    await request(app.getHttpServer()).post('/auth/setup').send(input).expect(409);
  });
});
