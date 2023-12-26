import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { Administrator } from '@/_administration/_administrator/schema/administrator.schema';
import { AuthenticationController } from '@/_administration/_authentication/controller/authentication.controller';
import { HOST } from '@/_administration/constant';

import { createAdministrator } from '../helper/administrator';
import {
  setupTestApplication,
  teardownTestApplication,
} from '../helper/bootstrap';
import { Mailhog } from '../helper/mailhog';

describe(`[Administrator] ${AuthenticationController.name} (e2e)`, () => {
  let start: Date;
  let application: INestApplication;
  let databaseConnection: Connection;
  let mailhog: Mailhog;

  beforeAll(async () => {
    start = new Date();

    const {
      application: testApplication,
      databaseConnection: testDatabaseConnection,
      mailhog: testMailhog,
    } = await setupTestApplication();

    application = testApplication;
    databaseConnection = testDatabaseConnection;
    mailhog = testMailhog;
  });

  afterAll(async () => {
    await teardownTestApplication(application, databaseConnection, {
      mailhog,
      start,
    });
  });

  describe('/login (POST)', () => {
    const administratorData: Pick<Administrator, 'username' | 'password'> = {
      username: 'administrator@email.com',
      password: 'P@ssw0rd',
    };

    beforeAll(async () => {
      await createAdministrator(
        {
          username: administratorData.username,
          password: administratorData.password,
        },
        databaseConnection,
      );
    });

    describe('[succeeds because]', () => {
      it('returns a HTTP:OK status with the `access-token` & `refresh-token` data when the provided credentials are correct', async () => {
        const { status, body } = await request(application.getHttpServer())
          .post('/login')
          .set('Host', HOST)
          .send({
            email: administratorData.username,
            password: administratorData.password,
          });

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
        // empty DTO
        {} as any,
        // all empty fields
        { email: '', password: '' },
        // empty password field
        { email: administratorData.username, password: '' },
        // empty email field
        { email: '', password: administratorData.password },
      ])(
        "responds with HTTP:BAD_REQUEST if the provided credentials are invalid [email: '$email', password: '$password']",
        async ({ email, password }) => {
          const { status } = await request(application.getHttpServer())
            .post('/login')
            .set('Host', HOST)
            .send({ email, password });

          expect(status).toBe(HttpStatus.BAD_REQUEST);
        },
      );

      it.each<{
        email: string;
        password: string;
      }>([
        // wrong password
        { email: administratorData.username, password: 'wrong-password' },
        // wrong email
        { email: 'wrong@email.com', password: administratorData.password },
      ])(
        "responds with HTTP:UNAUTHORIZED if the provided credentials are wrong [email: '$email', password: '$password']",
        async ({ email, password }) => {
          const { status } = await request(application.getHttpServer())
            .post('/login')
            .set('Host', HOST)
            .send({ email, password });

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });
});
