import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';

import { PasswordResetModule } from '@library/password-reset';
import { ResetPasswordController } from '@library/password-reset/controller/reset-password.controller';

import { Configuration } from './configuration';

describe(`${ResetPasswordController.name} (e2e)`, () => {
  const configuration = new Configuration();

  let application: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PasswordResetModule.forRoot(configuration.moduleOptions)],
    }).compile();

    application = moduleFixture.createNestApplication();

    await application.init();
  });

  afterAll(async () => {
    await application.close();
  });

  describe('Get Password-Reset Details', () => {
    describe('[succeeds because]', () => {
      let response: Response;

      beforeAll(async () => {
        await request(application.getHttpServer())
          .post(`/${configuration.moduleOptions.route.forgotPassword}`)
          .send({ username: configuration.user.email });

        response = await request(application.getHttpServer()).get(
          `/${configuration.moduleOptions.route.resetPassword.replace('/:id', '')}/${configuration.passwordResets[0]!.id}`,
        );
      });

      it(`returns 'HTTP ${HttpStatus.OK}' when the route is queried`, () => {
        expect(response.status).toBe(HttpStatus.OK);
      });
    });
  });

  describe('Reset Password', () => {
    describe('[succeeds because]', () => {
      let response: Response;

      beforeAll(async () => {
        response = await request(application.getHttpServer())
          .post(
            `/${configuration.moduleOptions.route.resetPassword.replace('/:id', '')}/${configuration.passwordResets[0]!.id}`,
          )
          .send({ newPassword: 'new-password' });
      });

      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' when a valid new password is sent`, () => {
        expect(response.status).toBe(HttpStatus.NO_CONTENT);
      });
    });
  });
});
