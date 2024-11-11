import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PasswordConfirmationController } from '../src/controller/password-confirmation.controller';
import { PasswordConfirmationDto } from '../src/dto/password-confirmation.dto';
import {
  authenticatedUser,
  authenticationModuleConfiguration,
} from './constant';
import { getAuthenticationTokens, setupTestApplication } from './helper';

describe(`${PasswordConfirmationController.name} (e2e)`, () => {
  let application: INestApplication;

  let accessToken: string;

  beforeAll(async () => {
    application = await setupTestApplication();

    ({ accessToken } = await getAuthenticationTokens(
      {
        username: authenticatedUser.username,
        password: authenticatedUser.password,
      },
      application,
      `/${authenticationModuleConfiguration.route.login}`,
      {
        accessToken: authenticationModuleConfiguration.cookie.accessToken.name,
      },
    ));
  });

  afterAll(async () => {
    await application.close();
  });

  describe(`${PasswordConfirmationController.name}::${PasswordConfirmationController.prototype.confirmPassword.name}`, () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the 'password-confirmation' cookie when the correct password is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${authenticationModuleConfiguration.route.passwordConfirmation}`,
          )
          .set('Cookie', accessToken)
          .send({
            password: authenticatedUser.password,
          });

        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        const cookies = response.get('Set-Cookie');

        // password-confirmation cookie
        expect(
          cookies.findIndex((cookie) =>
            cookie.startsWith(
              authenticationModuleConfiguration.cookie.passwordConfirmation
                .name,
            ),
          ),
        ).not.toBe(-1);
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the request is unauthenticated`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${authenticationModuleConfiguration.route.passwordConfirmation}`,
          )
          .send({ password: authenticatedUser.password });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it.each<Partial<PasswordConfirmationDto>>([
        {}, // empty DTO
        { password: '' }, // empty password field
      ])(
        `returns 'HTTP ${HttpStatus.BAD_REQUEST}' if an invalid password is sent {password: '$password'}`,
        async ({ password }) => {
          const response = await request(application.getHttpServer())
            .post(
              `/${authenticationModuleConfiguration.route.passwordConfirmation}`,
            )
            .set('Cookie', accessToken)
            .send({ password });

          expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        },
      );

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the wrong password is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${authenticationModuleConfiguration.route.passwordConfirmation}`,
          )
          .set('Cookie', accessToken)
          .send({ password: 'wrong-password' });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
