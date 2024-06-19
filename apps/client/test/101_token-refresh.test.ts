import { HttpStatus, INestApplication } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import request from 'supertest';

import { getAuthenticationTokens } from '@application/authentication/../test/helper';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../src/_authentication/constant';
import {
  createUser,
  setupTestApplication,
  teardownTestApplication,
} from './helper';

describe('Token-Refresh (e2e)', () => {
  let application: INestApplication;

  let mongoClient: MongoClient;
  let database: Db;

  const userCredentials = {
    username: 'user@email.dev',
    password: 'P@ssw0rd',
  };

  let authenticationTokens: { accessToken: string; refreshToken: string };

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

    authenticationTokens = await getAuthenticationTokens(
      userCredentials,
      application,
      '/login',
      ACCESS_TOKEN_COOKIE_NAME,
      REFRESH_TOKEN_COOKIE_NAME,
    );
  });

  afterAll(async () => {
    await teardownTestApplication(application, mongoClient, database);
  });

  describe('/token-refresh/access-token (POST)', () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the new access-token when the correct refresh-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post('/token-refresh/access-token')
          .set('Cookie', authenticationTokens.refreshToken);

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
          '/token-refresh/access-token',
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when an invalid refresh-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post('/token-refresh/access-token')
          .set('Cookie', `${REFRESH_TOKEN_COOKIE_NAME}=invalid-refresh-token;`);

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('/token-refresh/refresh-token (POST)', () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the new refresh-token when the correct access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post('/token-refresh/refresh-token')
          .set('Cookie', authenticationTokens.accessToken);

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
          '/token-refresh/refresh-token',
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when an invalid access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post('/token-refresh/refresh-token')
          .set('Cookie', `${ACCESS_TOKEN_COOKIE_NAME}=invalid-access-token;`);

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
