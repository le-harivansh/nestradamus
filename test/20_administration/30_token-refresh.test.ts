import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { Administrator } from '@/_administration/_administrator/schema/administrator.schema';
import { RefreshController } from '@/_administration/_authentication/_token/controller/refresh.controller';
import { RequiresAdministratorAccessToken } from '@/_administration/_authentication/guard/requires-administrator-access-token.guard';
import { RequiresAdministratorRefreshToken } from '@/_administration/_authentication/guard/requires-administrator-refresh-token.guard';
import { HOST } from '@/_administration/constant';

import { createAdministrator } from '../helper/administrator';
import {
  setupTestApplication,
  teardownTestApplication,
} from '../helper/bootstrap';
import { Mailhog } from '../helper/mailhog';

describe(`[Administrator] ${RefreshController.name} (e2e)`, () => {
  const administratorData: Pick<Administrator, 'username' | 'password'> = {
    username: 'administrator@email.com',
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
     * Create administrator & get authentication tokens
     */

    authenticationTokensData = await createAdministrator(
      {
        username: administratorData.username,
        password: administratorData.password,
      },
      databaseConnection,
      application.getHttpServer(),
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
          .set('Host', HOST)
          .set(
            RequiresAdministratorRefreshToken.HTTP_HEADER,
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
        {
          header: RequiresAdministratorRefreshToken.HTTP_HEADER,
          getValue: () => '',
        },
        {
          header: RequiresAdministratorRefreshToken.HTTP_HEADER,
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
            .set('Host', HOST)
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
          .set('Host', HOST)
          .set(
            RequiresAdministratorAccessToken.HTTP_HEADER,
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
        {
          header: RequiresAdministratorAccessToken.HTTP_HEADER,
          getValue: () => '',
        },
        {
          header: RequiresAdministratorAccessToken.HTTP_HEADER,
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
            .set('Host', HOST)
            .set(header, getValue());

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });
});
