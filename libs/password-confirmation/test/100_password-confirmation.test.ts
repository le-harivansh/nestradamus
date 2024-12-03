import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PasswordConfirmationController } from '../src/controller/password-confirmation.controller';
import { PasswordConfirmationDto } from '../src/dto/password-confirmation.dto';
import { setupTestApplication } from './helper/setup';
import { passwordConfirmationModuleOptions } from './helper/test.module';
import { testUser } from './helper/user';

describe(`${PasswordConfirmationController.name} (e2e)`, () => {
  let application: INestApplication;

  beforeAll(async () => {
    application = await setupTestApplication();
  });

  afterAll(async () => {
    await application.close();
  });

  describe(`${PasswordConfirmationController.name}::${PasswordConfirmationController.prototype.confirmPassword.name}`, () => {
    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' with the 'password-confirmation' cookie when the correct password is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(`/${passwordConfirmationModuleOptions.route}`)
          .send({
            password: testUser.password,
          });

        expect(response.status).toBe(HttpStatus.NO_CONTENT);

        const cookies = response.get('Set-Cookie');

        // password-confirmation cookie
        expect(
          cookies.findIndex((cookie) =>
            cookie.startsWith(passwordConfirmationModuleOptions.cookie.name),
          ),
        ).not.toBe(-1);
      });
    });

    describe('[fails because]', () => {
      it.each<Partial<PasswordConfirmationDto>>([
        {}, // empty DTO
        { password: '' }, // empty password field
      ])(
        `returns 'HTTP ${HttpStatus.BAD_REQUEST}' if an invalid password is sent { password: '$password' }`,
        async ({ password }) => {
          const response = await request(application.getHttpServer())
            .post(`/${passwordConfirmationModuleOptions.route}`)
            .send({ password });

          expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        },
      );

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the wrong password is sent`, async () => {
        const response = await request(application.getHttpServer())
          .post(`/${passwordConfirmationModuleOptions.route}`)
          .send({ password: 'wrong-password' });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
