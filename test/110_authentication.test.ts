import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { AuthenticationController } from '@/_authentication/controller/authentication.controller';
import { RegisterUserDto } from '@/_registration/dto/registration.dto';
import { User } from '@/_user/schema/user.schema';

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
    const userData: Pick<User, 'username' | 'password'> = {
      username: 'user-one',
      password: 'Le-P@ssw0rd',
    };

    beforeAll(async () => {
      await request(application.getHttpServer())
        .post('/register')
        .send(userData as RegisterUserDto);
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
