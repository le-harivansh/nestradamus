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
  const userData: Pick<User, 'email' | 'password'> = {
    email: 'user@email.com',
    password: 'P@ssw0rd',
  };

  let start: Date;
  let application: INestApplication;
  let databaseConnection: Connection;
  let mailhog: Mailhog;

  let authenticationTokensData: {
    accessToken: { token: string; expiresAt: number };
    refreshToken: { token: string; expiresAt: number };
  };

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
      it.each<{
        header: TokenHttpHeader;
        getValue: () => string;
      }>([
        { header: TokenHttpHeader.REFRESH_TOKEN, getValue: () => '' },
        {
          header: TokenHttpHeader.REFRESH_TOKEN,
          getValue: () => 'wrong-refresh-token',
        },
        {
          header: 'wrong-token-header' as TokenHttpHeader,
          getValue: () => authenticationTokensData.refreshToken.token,
        },
      ])(
        'responds with a HTTP:UNAUTHORIZED status when an incorrect `refresh-token` is provided',
        async ({ header, getValue }) => {
          const { status } = await request(application.getHttpServer())
            .get('/token/refresh/access-token')
            .set(header, getValue());

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
      it.each<{
        header: TokenHttpHeader;
        getValue: () => string;
      }>([
        { header: TokenHttpHeader.ACCESS_TOKEN, getValue: () => '' },
        {
          header: TokenHttpHeader.ACCESS_TOKEN,
          getValue: () => 'wrong-access-token',
        },
        {
          header: 'wrong-token-header' as TokenHttpHeader,
          getValue: () => authenticationTokensData.accessToken.token,
        },
      ])(
        "responds with a HTTP:UNAUTHORIZED status when an incorrect `access-token` is provided [header: '$header', value: '$value']",
        async ({ header, getValue }) => {
          const { status } = await request(application.getHttpServer())
            .get('/token/refresh/refresh-token')
            .set(header, getValue());

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });
});
