import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module.js';

describe.skipIf(!process.env.TEST_DATABASE_URL)('authentication with PostgreSQL', () => {
  let app: INestApplication;
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });
  afterAll(async () => { await app.close(); });

  it('registers, authenticates, rotates tokens and revokes the session', async () => {
    const credentials = { email: `${randomUUID()}@example.com`, password: 'a-long-test-password' };
    await request(app.getHttpServer()).post('/auth/register').send({ ...credentials, name: '  Ana  ' }).expect(201).expect(({ body }) => { expect(body.name).toBe('Ana'); });
    await request(app.getHttpServer()).post('/auth/login').send({ ...credentials, password: 'wrong-password' }).expect(401);
    const login = await request(app.getHttpServer()).post('/auth/login').send(credentials).expect(200);
    const access = login.body.accessToken as string;
    const refresh = login.body.refreshToken as string;
    await request(app.getHttpServer()).get('/auth/me').auth(access, { type: 'bearer' }).expect(200).expect(({ body }) => { expect(body.name).toBe('Ana'); });
    const rotated = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: refresh }).expect(200);
    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: refresh }).expect(401);
    await request(app.getHttpServer()).post('/auth/logout').auth(rotated.body.accessToken, { type: 'bearer' }).expect(204);
    await request(app.getHttpServer()).get('/auth/me').auth(access, { type: 'bearer' }).expect(401);
    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: rotated.body.refreshToken }).expect(401);
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
    await request(app.getHttpServer()).post('/auth/login').send({ ...credentials, password: 'another-long-password' }).expect(200);
  });
});
