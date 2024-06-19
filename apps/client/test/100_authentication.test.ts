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
      {
        firstName: 'One',
        lastName: 'Two',
        phoneNumber: '1212121212',
        email: userCredentials.username,
        password: userCredentials.password,
      },
      application,
    );
  });

  afterAll(async () => {
    await teardownTestApplication(application, mongoClient, database);
  });

  describe('/login (POST)', () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the 'access-token' cookie when the correct user-credentials are sent`, async () => {
        const response = await request(application.getHttpServer())
          .post('/login')
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
            .post('/login')
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
            .post('/login')
            .send({ username, password });

          expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });

  describe('/login (DELETE)', () => {
    let accessToken: string;

    beforeAll(async () => {
      ({ accessToken } = await getAuthenticationTokens(
        userCredentials,
        application,
        '/login',
        ACCESS_TOKEN_COOKIE_NAME,
        REFRESH_TOKEN_COOKIE_NAME,
      ));
    });

    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' when a valid access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .delete('/login')
          .set('Cookie', accessToken);

        expect(response.status).toBe(HttpStatus.NO_CONTENT);
      });

      it("clears the 'access-token' & 'refresh-token' cookies", async () => {
        const response = await request(application.getHttpServer())
          .delete('/login')
          .set('Cookie', accessToken);

        const tokens = response
          .get('Set-Cookie')
          ?.filter(
            (cookie) =>
              cookie.startsWith(`${ACCESS_TOKEN_COOKIE_NAME}=`) ||
              cookie.startsWith(`${REFRESH_TOKEN_COOKIE_NAME}=`),
          );

        expect(tokens).toHaveLength(2);

        for (const token of tokens!) {
          expect(token.includes('Expires=Thu, 01 Jan 1970 00:00:00 GMT;')).toBe(
            true,
          );
        }
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when no access-token is sent`, async () => {
        const response = await request(application.getHttpServer()).delete(
          '/login',
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when an invalid access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .delete('/login')
          .set('Cookie', `${ACCESS_TOKEN_COOKIE_NAME}=invalid-access-token;`);

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
