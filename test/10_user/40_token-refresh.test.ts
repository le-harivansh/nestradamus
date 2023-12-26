import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { RefreshController } from '@/_user/_authentication/_token/controller/refresh.controller';
import { RequiresUserAccessToken } from '@/_user/_authentication/guard/requires-user-access-token.guard';
import { RequiresUserRefreshToken } from '@/_user/_authentication/guard/requires-user-refresh-token.guard';
import { User } from '@/_user/_user/schema/user.schema';

import {
  setupTestApplication,
  teardownTestApplication,
} from '../helper/bootstrap';
import { Mailhog } from '../helper/mailhog';
import { registerUser } from '../helper/user';

describe(`[User] ${RefreshController.name} (e2e)`, () => {
  const userData: Pick<User, 'username' | 'password'> = {
    username: 'user@email.com',
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
      {
        email: userData.username,
        password: userData.password,
      },
      {
        httpServer: application.getHttpServer(),
        mailhog,
      },
      { login: true },
    );
  });

  afterAll(async () => {
    await teardownTestApplication(application, databaseConnection, {
      mailhog,
      start,
    });
  });

  describe('/token/refresh/access-token (GET)', () => {
    describe('[succeeds because]', () => {
      it('responds with a HTTP:OK status & the `access-token` when a correct `refresh-token` is provided', async () => {
        const { status, body } = await request(application.getHttpServer())
          .get('/token/refresh/access-token')
          .set(
            RequiresUserRefreshToken.HTTP_HEADER,
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
        header: string;
        getValue: () => string;
      }>([
        { header: RequiresUserRefreshToken.HTTP_HEADER, getValue: () => '' },
        {
          header: RequiresUserRefreshToken.HTTP_HEADER,
          getValue: () => 'wrong-refresh-token',
        },
        {
          header: 'wrong-token-header',
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
            RequiresUserAccessToken.HTTP_HEADER,
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
        header: string;
        getValue: () => string;
      }>([
        { header: RequiresUserAccessToken.HTTP_HEADER, getValue: () => '' },
        {
          header: RequiresUserAccessToken.HTTP_HEADER,
          getValue: () => 'wrong-access-token',
        },
        {
          header: 'wrong-token-header',
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
