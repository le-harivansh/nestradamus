import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { AuthenticationController } from '../src/_authentication/controller/authentication.controller';
import { setupTestApplication, teardownTestApplication } from './helper';

describe(`${AuthenticationController.name} (e2e)`, () => {
  let application: INestApplication;
  let databaseConnection: Connection;

  beforeAll(async () => {
    const {
      application: testApplication,
      databaseConnection: testDatabaseConnection,
    } = await setupTestApplication();

    application = testApplication;
    databaseConnection = testDatabaseConnection;
  });

  afterAll(async () => {
    await teardownTestApplication({
      application,
      databaseConnection,
    });
  });

  describe('/login (POST)', () => {
    const userData = {
      username: 'user-one',
      password: 'password-one',
    };

    beforeAll(async () => {
      await request(application.getHttpServer())
        .post('/register')
        .send(userData);
    });

    describe('[succeeds because]', () => {
      it('returns a HTTP:OK status with the `access-token` & `refresh-token` data when the provided credentials are correct', async () => {
        const { status, body } = await request(application.getHttpServer())
          .post('/login')
          .send(userData);

        expect(status).toBe(HttpStatus.OK);
        expect(body).toStrictEqual({
          accessToken: {
            token: expect.any(String),
            expiresAt: expect.any(Number),
          },
          refreshToken: {
            token: expect.any(String),
            expiresAt: expect.any(Number),
          },
        });
      });
    });

    describe('[fails because]', () => {
      it.each([
        { username: '', password: '' },
        { username: userData.username, password: '' },
        { username: '', password: userData.password },
        { username: userData.username, password: 'wrong-password' },
        { username: 'wrong-username', password: userData.password },
      ])(
        "responds with HTTP:UNAUTHORIZED if the provided credentials are wrong [username: '$username', password: '$password']",
        async ({ username, password }) => {
          const { status } = await request(application.getHttpServer())
            .post('/login')
            .send({ username, password });

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });
});
