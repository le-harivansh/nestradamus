import { HttpStatus, INestApplication } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import request from 'supertest';

import { getAuthenticationTokens } from '@library/authentication/../test/helper/setup';
import { PasswordConfirmationDto } from '@library/password-confirmation/dto/password-confirmation.dto';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  LOGIN_ROUTE,
} from '../src/_authentication/constant';
import {
  PASSWORD_CONFIRMATION_COOKIE_NAME,
  PASSWORD_CONFIRMATION_ROUTE,
} from '../src/_password-confirmation/constant';
import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/application';
import { createUser } from './helper/user';

describe('Password-Confirmation (e2e)', () => {
  let application: INestApplication;

  let mongoClient: MongoClient;
  let database: Db;

  const userPassword = 'P@ssw0rd';

  let accessToken: string;

  beforeAll(async () => {
    const testApplication = await setupTestApplication();

    ({ application, mongoClient, database } = testApplication);

    const userData = {
      firstName: 'One',
      lastName: 'Two',
      phoneNumber: '1212121212',
      email: 'user@email.dev',
      password: userPassword,
    };

    // Create user
    await createUser(userData, application);

    ({ accessToken } = await getAuthenticationTokens(
      { username: userData.email, password: userPassword },
      application,
      `/${LOGIN_ROUTE}`,
      { accessToken: ACCESS_TOKEN_COOKIE_NAME },
    ));
  });

  afterAll(async () => {
    await teardownTestApplication(application, mongoClient, database);
  });

  describe(`POST /${PASSWORD_CONFIRMATION_ROUTE}`, () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the new password-confirmation cookie when the correct password is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(`/${PASSWORD_CONFIRMATION_ROUTE}`)
          .set('Cookie', accessToken)
          .send({ password: userPassword });

        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        const passwordConfirmationCookie = response
          .get('Set-Cookie')
          .find((cookie) =>
            cookie.startsWith(PASSWORD_CONFIRMATION_COOKIE_NAME),
          );

        expect(passwordConfirmationCookie).not.toBeUndefined();
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when no access-token is sent`, async () => {
        const response = await request(application.getHttpServer()).post(
          `/${PASSWORD_CONFIRMATION_ROUTE}`,
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it.each<Partial<PasswordConfirmationDto>>([
        {}, // empty DTO
        { password: '' }, // empty password field
      ])(
        `returns 'HTTP ${HttpStatus.BAD_REQUEST}' when an invalid password is sent {password: '$password'}`,
        async ({ password }) => {
          const response = await request(application.getHttpServer())
            .post(`/${PASSWORD_CONFIRMATION_ROUTE}`)
            .set('Cookie', accessToken)
            .send({ password });

          expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        },
      );

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the wrong password is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(`/${PASSWORD_CONFIRMATION_ROUTE}`)
          .set('Cookie', accessToken)
          .send({ password: 'wrong-password' });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
