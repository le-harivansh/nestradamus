import { HttpStatus, INestApplication } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import request from 'supertest';

import { getAuthenticationTokens } from '@library/authentication/../test/helper/setup';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_REFRESH_ROUTE,
  LOGIN_ROUTE,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_REFRESH_ROUTE,
} from '../src/_authentication/constant';
import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/application';
import { createUser } from './helper/user';

describe('Token-Refresh (e2e)', () => {
  let application: INestApplication;

  let mongoClient: MongoClient;
  let database: Db;

  const userCredentials = {
    username: 'user@email.dev',
    password: 'P@ssw0rd',
  };

  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const testApplication = await setupTestApplication();

    ({ application, mongoClient, database } = testApplication);

    // Create user
    await createUser(
      {
        firstName: 'One',
        lastName: 'Two',
        phoneNumber: '1212121212',
        email: userCredentials.username,
        password: userCredentials.password,
      },
      application,
    );

    ({ accessToken, refreshToken } = await getAuthenticationTokens(
      userCredentials,
      application,
      `/${LOGIN_ROUTE}`,
      {
        accessToken: ACCESS_TOKEN_COOKIE_NAME,
        refreshToken: REFRESH_TOKEN_COOKIE_NAME,
      },
    ));
  });

  afterAll(async () => {
    await teardownTestApplication(application, mongoClient, database);
  });

  describe(`POST /${ACCESS_TOKEN_REFRESH_ROUTE}`, () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the new access-token when the correct refresh-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(`/${ACCESS_TOKEN_REFRESH_ROUTE}`)
          .set('Cookie', refreshToken);

        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        const newAccessToken = response
          .get('Set-Cookie')
          .find((cookie) => cookie.startsWith(ACCESS_TOKEN_COOKIE_NAME));

        expect(newAccessToken).not.toBeUndefined();
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when no refresh-token is sent`, async () => {
        const response = await request(application.getHttpServer()).post(
          `/${ACCESS_TOKEN_REFRESH_ROUTE}`,
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when an invalid refresh-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(`/${ACCESS_TOKEN_REFRESH_ROUTE}`)
          .set('Cookie', `${REFRESH_TOKEN_COOKIE_NAME}=invalid-refresh-token;`);

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe(`POST /${REFRESH_TOKEN_REFRESH_ROUTE}`, () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the new refresh-token when the correct access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(`/${REFRESH_TOKEN_REFRESH_ROUTE}`)
          .set('Cookie', accessToken);

        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        const newRefreshToken = response
          .get('Set-Cookie')
          .find((cookie) => cookie.startsWith(REFRESH_TOKEN_COOKIE_NAME));

        expect(newRefreshToken).not.toBeUndefined();
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when no access-token is sent`, async () => {
        const response = await request(application.getHttpServer()).post(
          `/${REFRESH_TOKEN_REFRESH_ROUTE}`,
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when an invalid access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(`/${REFRESH_TOKEN_REFRESH_ROUTE}`)
          .set('Cookie', `${ACCESS_TOKEN_COOKIE_NAME}=invalid-access-token;`);

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
