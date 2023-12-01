import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { RefreshController } from '@/_authentication/_token/controller/refresh.controller';
import { TokenHttpHeader } from '@/_authentication/constant';
import { User } from '@/_user/schema/user.schema';

import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/bootstrap';
import { Mailhog } from './helper/mailhog';
import { registerUser } from './helper/user';

describe(`${RefreshController.name} (e2e)`, () => {
  const start = new Date();

  const userData: Pick<User, 'email' | 'password'> = {
    email: 'user@email.com',
    password: 'P@ssw0rd',
  };

  let application: INestApplication;
  let databaseConnection: Connection;
  let mailhog: Mailhog;

  let authenticationTokensData: {
    accessToken: { token: string; expiresAt: number };
    refreshToken: { token: string; expiresAt: number };
  };

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

    /**
     * Create user & get user authentication tokens
     */

    authenticationTokensData = await registerUser(
      userData,
      {
        httpServer: application.getHttpServer(),
        mailhog,
      },
      { login: true },
    );
  });

  afterAll(async () => {
    await mailhog.deleteEmailsSentBetween(start, new Date());

    await teardownTestApplication({
      application,
      databaseConnection,
    });
  });

  describe('/token/refresh/access-token (GET)', () => {
    describe('[succeeds because]', () => {
      it('responds with a HTTP:OK status & the `access-token` when a correct `refresh-token` is provided', async () => {
        const { status, body } = await request(application.getHttpServer())
          .get('/token/refresh/access-token')
          .set(
            TokenHttpHeader.REFRESH_TOKEN,
            authenticationTokensData.refreshToken.token,
          );

        expect(status).toBe(HttpStatus.OK);
        expect(body).toStrictEqual({
          token: expect.any(String),
          expiresAt: expect.any(Number),
        });
      });
    });

    describe('[fails because]', () => {
      /**
       * We assign a method to `value` because we want
       * `authenticationTokensData.refreshToken.token` to be evaluated
       * when the tests run; not when the test-runner is parsing the test file.
       *
       * If we pass `authenticationTokensData.refreshToken.token` to `value`, it
       * will be evaluated when the test-runner parses the file - before any hook
       * is run - which will result in `authenticationTokensData` being evaluated
       * as `undefined` (its starting value), and as a consequence, `value` will
       * be `undefined`.
       */
      it.each<{
        header: TokenHttpHeader;
        value: () => string;
      }>([
        { header: TokenHttpHeader.REFRESH_TOKEN, value: () => '' },
        {
          header: TokenHttpHeader.REFRESH_TOKEN,
          value: () => 'wrong-refresh-token',
        },
        {
          header: 'wrong-token-header' as TokenHttpHeader,
          value: () => authenticationTokensData.refreshToken.token,
        },
      ])(
        "responds with a HTTP:UNAUTHORIZED status when an incorrect `refresh-token` is provided [header: '$header', value: '$value']",
        async ({ header, value }) => {
          const { status } = await request(application.getHttpServer())
            .get('/token/refresh/access-token')
            .set(header, value());

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });

  describe('/token/refresh/refresh-token (GET)', () => {
    describe('[succeeds because]', () => {
      it('responds with a HTTP:OK status & the `refresh-token` when a correct `access-token` is provided', async () => {
        const { status, body } = await request(application.getHttpServer())
          .get('/token/refresh/refresh-token')
          .set(
            TokenHttpHeader.ACCESS_TOKEN,
            authenticationTokensData.accessToken.token,
          );

        expect(status).toBe(HttpStatus.OK);
        expect(body).toStrictEqual({
          token: expect.any(String),
          expiresAt: expect.any(Number),
        });
      });
    });

    describe('[fails because]', () => {
      /**
       * See line 78 - 88 about why `value` is assigned a function.
       */
      it.each<{
        header: TokenHttpHeader;
        value: () => string;
      }>([
        { header: TokenHttpHeader.ACCESS_TOKEN, value: () => '' },
        {
          header: TokenHttpHeader.ACCESS_TOKEN,
          value: () => 'wrong-access-token',
        },
        {
          header: 'wrong-token-header' as TokenHttpHeader,
          value: () => authenticationTokensData.accessToken.token,
        },
      ])(
        "responds with a HTTP:UNAUTHORIZED status when an incorrect `access-token` is provided [header: '$header', value: '$value']",
        async ({ header, value }) => {
          const { status } = await request(application.getHttpServer())
            .get('/token/refresh/refresh-token')
            .set(header, value());

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });
});
