import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';

import { LoginController } from '@library/authentication/controller/login.controller';
import { LoginDto } from '@library/authentication/dto/login.dto';

import {
  authenticatedUser,
  authenticationModuleConfiguration,
} from './constant';
import { getAuthenticationTokens, setupTestApplication } from './helper';

describe(`${LoginController.name} (e2e)`, () => {
  let application: INestApplication;

  beforeAll(async () => {
    application = await setupTestApplication();
  });

  afterAll(async () => {
    await application.close();
  });

  describe('Login', () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the 'access-token' cookie when the correct user-credentials are sent`, async () => {
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

  describe('Logout', () => {
    let accessToken: string;

    beforeAll(async () => {
      ({ accessToken } = await getAuthenticationTokens(
        {
          username: authenticatedUser.username,
          password: authenticatedUser.password,
        },
        application,
        `/${authenticationModuleConfiguration.route.login}`,
        authenticationModuleConfiguration.cookie.accessToken.name,
        authenticationModuleConfiguration.cookie.refreshToken.name,
      ));
    });

    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the 'access-token' cookie when a valid access-token is sent`, async () => {
        const response = await request(application.getHttpServer())
          .delete(`/${authenticationModuleConfiguration.route.login}`)
          .set('Cookie', accessToken);

        expect(response.status).toBe(HttpStatus.NO_CONTENT);
      });

      it("clears the 'access-token' & 'refresh-token' cookies", async () => {
        const response = await request(application.getHttpServer())
          .delete(`/${authenticationModuleConfiguration.route.login}`)
          .set('Cookie', accessToken);

        const tokens = response
          .get('Set-Cookie')
          ?.filter(
            (cookie) =>
              cookie.startsWith(
                `${authenticationModuleConfiguration.cookie.accessToken.name}=`,
              ) ||
              cookie.startsWith(
                `${authenticationModuleConfiguration.cookie.refreshToken.name}=`,
              ),
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
