import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createHmac, randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { AuthService } from '../src/auth/auth.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe.skipIf(!process.env.TEST_DATABASE_URL)('authentication with PostgreSQL', () => {
  let app: INestApplication;
  let auth: AuthService;
  let prisma: PrismaService;
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    auth = app.get(AuthService);
    prisma = app.get(PrismaService);
  });

  it('limits parallel failures per normalized email and clears the counter after a successful login', async () => {
    const email = `${randomUUID()}@example.com`;
    const password = 'a-long-test-password';
    await request(app.getHttpServer()).post('/auth/register').send({ email, password, name: 'Ana' }).expect(201);
    // Calling the service directly isolates the per-account rule from the separate IP guard.
    const attempts = await Promise.allSettled(Array.from({ length: 6 }, (_, i) => auth.login({ email: i % 2 ? email.toUpperCase() : email, password: 'wrong-password' })));
    expect(attempts.filter((result) => result.status === 'rejected' && result.reason.getStatus() === 401)).toHaveLength(5);
    expect(attempts.filter((result) => result.status === 'rejected' && result.reason.getStatus() === 429)).toHaveLength(1);
    const accountKey = createHmac('sha256', process.env.JWT_SECRET!).update(email).digest('hex');
    const blocked = await prisma.db.orm.public.LoginAttempt.where({ accountKey }).first();
    expect(blocked?.failedAttempts).toBe(5);
    await expect(auth.login({ email, password })).rejects.toMatchObject({ response: { code: 'LOGIN_RATE_LIMITED' } });

    // Advance the stored deadline, without depending on a real-time sleep.
    await prisma.db.orm.public.LoginAttempt.where({ accountKey }).update({ lockedUntil: new Date(Date.now() - 1000).toISOString() });
    await expect(auth.login({ email, password })).resolves.toHaveProperty('accessToken');
    expect(await prisma.db.orm.public.LoginAttempt.where({ accountKey }).first()).toBeNull();
  });

  it('applies the same backoff to unknown emails', async () => {
    const email = `${randomUUID()}@example.com`;
    for (let i = 0; i < 5; i++) await expect(auth.login({ email, password: 'wrong-password' })).rejects.toMatchObject({ status: 401 });
    await expect(auth.login({ email, password: 'wrong-password' })).rejects.toMatchObject({ response: { code: 'LOGIN_RATE_LIMITED' } });
  });
  afterAll(async () => { await app.close(); });

  it('detects refresh reuse, revokes the family and preserves other sessions', async () => {
    const credentials = { email: `${randomUUID()}@example.com`, password: 'a-long-test-password' };
    await request(app.getHttpServer()).post('/auth/register').send({ ...credentials, name: '  Ana  ' }).expect(201).expect(({ body }) => { expect(body.name).toBe('Ana'); });
    const login = await request(app.getHttpServer()).post('/auth/login').send(credentials).expect(200);
    const other = await request(app.getHttpServer()).post('/auth/login').send(credentials).expect(200);
    const access = login.body.accessToken as string;
    const refresh = login.body.refreshToken as string;
    await request(app.getHttpServer()).get('/auth/me').auth(access, { type: 'bearer' }).expect(200).expect(({ body }) => { expect(body.name).toBe('Ana'); });
    const forged = `${refresh.split('.')[0]}.${'x'.repeat(43)}`;
    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: forged }).expect(401);
    await request(app.getHttpServer()).get('/auth/me').auth(access, { type: 'bearer' }).expect(200);
    const rotated = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: refresh }).expect(200);
    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: refresh }).expect(401).expect(({ body }) => { expect(body.code).toBe('REFRESH_TOKEN_REUSE'); });
    await request(app.getHttpServer()).get('/auth/me').auth(access, { type: 'bearer' }).expect(401).expect(({ body }) => { expect(body.code).toBe('REFRESH_TOKEN_REUSE'); });
    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: rotated.body.refreshToken }).expect(401).expect(({ body }) => { expect(body.code).toBe('REFRESH_TOKEN_REUSE'); });
    await request(app.getHttpServer()).get('/auth/me').auth(other.body.accessToken, { type: 'bearer' }).expect(200);

    const attempts = await Promise.all([
      request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: other.body.refreshToken }),
      request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: other.body.refreshToken }),
    ]);
    expect(attempts.map((response) => response.status).sort((a, b) => a - b)).toEqual([200, 401]);
    const rejected = attempts.find((response) => response.status === 401)!;
    const winner = attempts.find((response) => response.status === 200)!;
    expect(rejected.body.code).toBe('REFRESH_TOKEN_REUSE');
    await request(app.getHttpServer()).get('/auth/me').auth(winner.body.accessToken, { type: 'bearer' }).expect(401);
  });

  it('changes passwords and revokes existing sessions', async () => {
    const credentials = { email: `${randomUUID()}@example.com`, password: 'a-long-test-password' };
    await request(app.getHttpServer()).post('/auth/register').send({ ...credentials, name: 'Ana' }).expect(201);
    const login = await request(app.getHttpServer()).post('/auth/login').send(credentials).expect(200);
    await request(app.getHttpServer()).post('/auth/change-password')
      .auth(login.body.accessToken, { type: 'bearer' })
      .send({ currentPassword: credentials.password, newPassword: 'another-long-password' }).expect(204);
    await request(app.getHttpServer()).get('/auth/me').auth(login.body.accessToken, { type: 'bearer' }).expect(401);
    await request(app.getHttpServer()).post('/auth/login').send(credentials).expect(401);
    const newLogin = await request(app.getHttpServer()).post('/auth/login').send({ ...credentials, password: 'another-long-password' }).expect(200);
    await request(app.getHttpServer()).post('/auth/logout').auth(newLogin.body.accessToken, { type: 'bearer' }).expect(204);
    await request(app.getHttpServer()).get('/auth/me').auth(newLogin.body.accessToken, { type: 'bearer' }).expect(401);
  });
});
