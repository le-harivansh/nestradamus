import { HttpStatus, INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';

import { LoginController } from '@library/authentication/controller/login.controller';
import { LoginDto } from '@library/authentication/dto/login.dto';

import {
  authenticatedUser,
  authenticationModuleConfiguration,
} from './helper/constant';
import { getAuthenticationTokens, setupTestApplication } from './helper/setup';

describe(`${LoginController.name} (e2e)`, () => {
  let application: INestApplication;

  beforeAll(async () => {
    application = await setupTestApplication();
  });

  afterAll(async () => {
    await application.close();
  });

  describe(`${LoginController.name}::${LoginController.prototype.login.name}`, () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the 'access-token', 'refresh-token', & 'password-confirmation' cookies when the correct user-credentials are sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(`/${authenticationModuleConfiguration.route.login}`)
          .send({
            username: authenticatedUser.username,
            password: authenticatedUser.password,
          });

        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        const cookies = response.get('Set-Cookie');

        // access-token
        expect(
          cookies.findIndex((cookie) =>
            cookie.startsWith(
              authenticationModuleConfiguration.cookie.accessToken.name,
            ),
          ),
        ).not.toBe(-1);

        // refresh-token
        expect(
          cookies.findIndex((cookie) =>
            cookie.startsWith(
              authenticationModuleConfiguration.cookie.refreshToken.name,
            ),
          ),
        ).not.toBe(-1);
      });
    });

    describe('[fails because]', () => {
      it.each<Partial<LoginDto>>([
        {}, // empty DTO
        { username: '', password: '' }, // all empty fields
        { password: 'P@ssw0rd' }, // empty username field
        { username: 'user@email.dev' }, // empty password field
      ])(
        `returns 'HTTP ${HttpStatus.BAD_REQUEST}' if invalid credentials are sent {username: $username, password: $password}`,
        async ({ username, password }) => {
          const response = await request(application.getHttpServer())
            .post(`/${authenticationModuleConfiguration.route.login}`)
            .send({ username, password });

          expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        },
      );

      it.each<LoginDto>([
        { username: 'wrong@email.dev', password: 'P@ssw0rd' }, // wrong username field
        { username: 'user@email.dev', password: 'wrong-password' }, // wrong password field
        { username: 'wrong@email.dev', password: 'wrong-password' }, // wrong username & password fields
      ])(
        `returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if wrong credentials are sent {username: '$username', password: '$password'}`,
        async ({ username, password }) => {
          const response = await request(application.getHttpServer())
            .post(`/${authenticationModuleConfiguration.route.login}`)
            .send({ username, password });

          expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });

  describe(`${LoginController.name}::${LoginController.prototype.logout.name}`, () => {
    let accessToken: string;

    beforeAll(async () => {
      ({ accessToken } = await getAuthenticationTokens(
        {
          username: authenticatedUser.username,
          password: authenticatedUser.password,
        },
        application,
        `/${authenticationModuleConfiguration.route.login}`,
        {
          accessToken:
            authenticationModuleConfiguration.cookie.accessToken.name,
        },
      ));
    });

    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the 'access-token' cookie when a valid access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .delete(`/${authenticationModuleConfiguration.route.login}`)
          .set('Cookie', accessToken);

        expect(response.status).toBe(HttpStatus.NO_CONTENT);
      });

      describe('clears the:', () => {
        let response: Response;

        beforeAll(async () => {
          response = await request(application.getHttpServer())
            .delete(`/${authenticationModuleConfiguration.route.login}`)
            .set('Cookie', accessToken);
        });

        it.each([
          {
            testName: 'access-token',
            cookieName:
              authenticationModuleConfiguration.cookie.accessToken.name,
          },
          {
            testName: 'refresh-token',
            cookieName:
              authenticationModuleConfiguration.cookie.accessToken.name,
          },
          {
            testName: 'password-confirmation',
            cookieName:
              authenticationModuleConfiguration.cookie.accessToken.name,
          },
        ])('$testName cookie', ({ cookieName }) => {
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
          `/${authenticationModuleConfiguration.route.login}`,
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' when an invalid access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .delete(`/${authenticationModuleConfiguration.route.login}`)
          .set(
            'Cookie',
            `${authenticationModuleConfiguration.cookie.accessToken.name}=invalid-access-token;`,
          );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
