import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';

import { TokenRefreshController } from '@library/authentication/controller/token-refresh.controller';

import {
  authenticatedUser,
  authenticationModuleConfiguration,
} from './helper/constant';
import { getAuthenticationTokens, setupTestApplication } from './helper/setup';

describe(`${TokenRefreshController.name} (e2e)`, () => {
  let application: INestApplication;

  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    application = await setupTestApplication();

    ({ accessToken, refreshToken } = await getAuthenticationTokens(
      {
        username: authenticatedUser.username,
        password: authenticatedUser.password,
      },
      application,
      `/${authenticationModuleConfiguration.route.login}`,
      {
        accessToken: authenticationModuleConfiguration.cookie.accessToken.name,
        refreshToken:
          authenticationModuleConfiguration.cookie.refreshToken.name,
      },
    ));
  });

  afterAll(async () => {
    await application.close();
  });

  describe(`${TokenRefreshController.name}::${TokenRefreshController.prototype.refreshAccessToken.name}`, () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the new access-token when the correct refresh-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${authenticationModuleConfiguration.route.tokenRefresh.accessToken}`,
          )
          .set('Cookie', refreshToken);

        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        const newAccessToken = response
          .get('Set-Cookie')
          .find((cookie) =>
            cookie.startsWith(
              authenticationModuleConfiguration.cookie.accessToken.name,
            ),
          );

        expect(newAccessToken).not.toBeUndefined();
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when no refresh-token is sent`, async () => {
        const response = await request(application.getHttpServer()).post(
          `/${authenticationModuleConfiguration.route.tokenRefresh.accessToken}`,
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when an invalid refresh-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${authenticationModuleConfiguration.route.tokenRefresh.accessToken}`,
          )
          .set(
            'Cookie',
            `${authenticationModuleConfiguration.cookie.refreshToken.name}=invalid-refresh-token;`,
          );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe(`${TokenRefreshController.name}::${TokenRefreshController.prototype.refreshRefreshToken.name}`, () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the new refresh-token when the correct access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${authenticationModuleConfiguration.route.tokenRefresh.refreshToken}`,
          )
          .set('Cookie', accessToken);

        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        const newRefreshToken = response
          .get('Set-Cookie')
          .find((cookie) =>
            cookie.startsWith(
              authenticationModuleConfiguration.cookie.refreshToken.name,
            ),
          );

        expect(newRefreshToken).not.toBeUndefined();
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when no access-token is sent`, async () => {
        const response = await request(application.getHttpServer()).post(
          `/${authenticationModuleConfiguration.route.tokenRefresh.refreshToken}`,
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when an invalid access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${authenticationModuleConfiguration.route.tokenRefresh.refreshToken}`,
          )
          .set(
            'Cookie',
            `${authenticationModuleConfiguration.cookie.accessToken.name}=invalid-access-token;`,
          );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
