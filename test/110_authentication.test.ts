import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { AuthenticationController } from '@/_authentication/controller/authentication.controller';
import { User } from '@/_user/schema/user.schema';

import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/bootstrap';
import { Mailhog } from './helper/mailhog';
import { registerUser } from './helper/user';

describe(`${AuthenticationController.name} (e2e)`, () => {
  const start = new Date();

  let application: INestApplication;
  let databaseConnection: Connection;
  let mailhog: Mailhog;

  beforeAll(async () => {
    const {
      application: testApplication,
      databaseConnection: testDatabaseConnection,
    } = await setupTestApplication();

    application = testApplication;
    databaseConnection = testDatabaseConnection;

    /**
     * It is assumed that the mailhog service is being served from
     * the default host & port (`localhost:8025`)
     */
    mailhog = new Mailhog();
  });

  afterAll(async () => {
    await mailhog.deleteEmailsSentBetween(start, new Date());

    await teardownTestApplication({
      application,
      databaseConnection,
    });
  });

  describe('/login (POST)', () => {
    const userData: Pick<User, 'email' | 'password'> = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };

    beforeAll(async () => {
      await registerUser(userData, {
        httpServer: application.getHttpServer(),
        mailhog,
      });
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
      it.each<{
        email: string;
        password: string;
      }>([
        { email: '', password: '' }, // all empty fields
        { email: userData.email, password: '' }, // empty password field
        { email: '', password: userData.password }, // empty email field
        { email: userData.email, password: 'wrong-password' }, // wrong password
        { email: 'wrong@email.com', password: userData.password }, // wrong email
      ])(
        "responds with HTTP:UNAUTHORIZED if the provided credentials are wrong [email: '$email', password: '$password']",
        async ({ email, password }) => {
          const { status } = await request(application.getHttpServer())
            .post('/login')
            .send({ email, password });

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });
});
