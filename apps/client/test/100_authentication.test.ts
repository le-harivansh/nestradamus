import { HttpStatus, INestApplication } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import request, { Response } from 'supertest';

import { getAuthenticationTokens } from '@library/authentication/../test/helper/setup';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  LOGIN_ROUTE,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../src/_authentication/constant';
import { PASSWORD_CONFIRMATION_COOKIE_NAME } from '../src/_password-confirmation/constant';
import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/application';
import { createUser, fakeUserData } from './helper/user';

describe('Authentication (e2e)', () => {
  const userCredentials = {
    username: 'user@email.dev',
    password: 'P@ssw0rd',
  };

  let application: INestApplication;

  let mongoClient: MongoClient;
  let database: Db;

  beforeAll(async () => {
    const testApplication = await setupTestApplication();

    ({ application, mongoClient, database } = testApplication);

    await createUser(
      fakeUserData({
        email: userCredentials.username,
        password: userCredentials.password,
      }),
      application,
    );
  });

  afterAll(async () => {
    await teardownTestApplication(application, mongoClient, database);
  });

  describe(`POST /${LOGIN_ROUTE}`, () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the 'access-token' cookie when the correct user-credentials are sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(`/${LOGIN_ROUTE}`)
          .send(userCredentials);

        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        const cookies = response.get('Set-Cookie');

        // access-token
        expect(
          cookies.findIndex((cookie) =>
            cookie.startsWith(ACCESS_TOKEN_COOKIE_NAME),
          ),
        ).not.toBe(-1);

        // refresh-token
        expect(
          cookies.findIndex((cookie) =>
            cookie.startsWith(REFRESH_TOKEN_COOKIE_NAME),
          ),
        ).not.toBe(-1);

        // password-confirmation token
        expect(
          cookies.findIndex((cookie) =>
            cookie.startsWith(PASSWORD_CONFIRMATION_COOKIE_NAME),
          ),
        ).not.toBe(-1);
      });
    });

    describe('[fails because]', () => {
      it.each([
        {}, // all empty fields
        { password: 'P@ssw0rd' }, // empty username field
        { username: 'user@email.dev' }, // empty password field
      ])(
        `returns 'HTTP ${HttpStatus.BAD_REQUEST}' if invalid credentials are sent {username: $username, password: $password}`,
        async ({ username, password }) => {
          const response = await request(application.getHttpServer())
            .post(`/${LOGIN_ROUTE}`)
            .send({ username, password });

          expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        },
      );

      it.each([
        { username: 'wrong@email.dev', password: 'P@ssw0rd' }, // wrong username field
        { username: 'user@email.dev', password: 'wrong-password' }, // wrong password field
        { username: 'wrong@email.dev', password: 'wrong-password' }, // wrong username & password fields
      ])(
        `returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if wrong credentials are sent {username: $username, password: $password}`,
        async ({ username, password }) => {
          const response = await request(application.getHttpServer())
            .post(`/${LOGIN_ROUTE}`)
            .send({ username, password });

          expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });

  describe(`DELETE /${LOGIN_ROUTE}`, () => {
    let accessToken: string;

    beforeAll(async () => {
      ({ accessToken } = await getAuthenticationTokens(
        userCredentials,
        application,
        `/${LOGIN_ROUTE}`,
        { accessToken: ACCESS_TOKEN_COOKIE_NAME },
      ));
    });

    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' when a valid access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .delete(`/${LOGIN_ROUTE}`)
          .set('Cookie', accessToken);

        expect(response.status).toBe(HttpStatus.NO_CONTENT);
      });

      describe('clears the:', () => {
        let response: Response;

        beforeAll(async () => {
          response = await request(application.getHttpServer())
            .delete(`/${LOGIN_ROUTE}`)
            .set('Cookie', accessToken);
        });

        it.each([
          { testName: 'access-token', cookieName: ACCESS_TOKEN_COOKIE_NAME },
          { testName: 'refresh-token', cookieName: REFRESH_TOKEN_COOKIE_NAME },
          {
            testName: 'password-confirmation token',
            cookieName: PASSWORD_CONFIRMATION_COOKIE_NAME,
          },
        ])('$testName', ({ cookieName }) => {
          const cookie = response
            .get('Set-Cookie')
            // eslint-disable-next-line max-nested-callbacks
            .filter((cookie) => cookie.startsWith(`${cookieName}=`))[0];

          expect(cookie).not.toBeUndefined();

          expect(
            cookie!.includes('Expires=Thu, 01 Jan 1970 00:00:00 GMT;'),
          ).toBe(true);
        });
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when no access-token is sent`, async () => {
        const response = await request(application.getHttpServer()).delete(
          `/${LOGIN_ROUTE}`,
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when an invalid access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .delete(`/${LOGIN_ROUTE}`)
          .set('Cookie', `${ACCESS_TOKEN_COOKIE_NAME}=invalid-access-token;`);

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
