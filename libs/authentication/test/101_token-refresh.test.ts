import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';

import { TokenRefreshController } from '@application/authentication/controller/token-refresh.controller';

import {
  authenticatedUser,
  authenticationModuleConfiguration,
} from './constant';
import { getAuthenticationTokens, setupTestApplication } from './helper';

describe(`${TokenRefreshController.name} (e2e)`, () => {
  let application: INestApplication;
  let jwtCookies: {
    accessToken: string;
    refreshToken: string;
  };

  beforeAll(async () => {
    application = await setupTestApplication();

    jwtCookies = await getAuthenticationTokens(
      {
        username: authenticatedUser.username,
        password: authenticatedUser.password,
      },
      application,
      `/${authenticationModuleConfiguration.routes.login.withCredentials}`,
      authenticationModuleConfiguration.accessToken.cookieName,
      authenticationModuleConfiguration.refreshToken.cookieName,
    );
  });

  afterAll(async () => {
    await application.close();
  });

  describe('Refresh access-token', () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the new access-token when the correct refresh-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${authenticationModuleConfiguration.routes.refresh.accessToken}`,
          )
          .set('Cookie', jwtCookies.refreshToken);

        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        const newAccessToken = response
          .get('Set-Cookie')
          .find((cookie) =>
            cookie.startsWith(
              authenticationModuleConfiguration.accessToken.cookieName,
            ),
          );

        expect(newAccessToken).not.toBeUndefined();
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when no refresh-token is sent`, async () => {
        const response = await request(application.getHttpServer()).post(
          `/${authenticationModuleConfiguration.routes.refresh.accessToken}`,
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when an invalid refresh-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${authenticationModuleConfiguration.routes.refresh.accessToken}`,
          )
          .set(
            'Cookie',
            `${authenticationModuleConfiguration.refreshToken.cookieName}=invalid-refresh-token;`,
          );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('Refresh refresh-token', () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the new refresh-token when the correct access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${authenticationModuleConfiguration.routes.refresh.refreshToken}`,
          )
          .set('Cookie', jwtCookies.accessToken);

        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        const newRefreshToken = response
          .get('Set-Cookie')
          .find((cookie) =>
            cookie.startsWith(
              authenticationModuleConfiguration.refreshToken.cookieName,
            ),
          );

        expect(newRefreshToken).not.toBeUndefined();
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when no access-token is sent`, async () => {
        const response = await request(application.getHttpServer()).post(
          `/${authenticationModuleConfiguration.routes.refresh.refreshToken}`,
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when an invalid access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${authenticationModuleConfiguration.routes.refresh.refreshToken}`,
          )
          .set(
            'Cookie',
            `${authenticationModuleConfiguration.accessToken.cookieName}=invalid-access-token;`,
          );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
