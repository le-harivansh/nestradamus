import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';

import { PasswordResetModule } from '@library/password-reset';
import { ForgotPasswordController } from '@library/password-reset/controller/forgot-password.controller';

import { Configuration } from './configuration';

describe(`${ForgotPasswordController.name} (e2e)`, () => {
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

  describe('Forgot Password', () => {
    describe('[succeeds because]', () => {
      let response: Response;

      beforeAll(async () => {
        response = await request(application.getHttpServer())
          .post(`/${configuration.moduleOptions.route.forgotPassword}`)
          .send({ username: configuration.user.email });
      });

      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' when an existing user's username is sent`, () => {
        expect(response.status).toBe(HttpStatus.NO_CONTENT);
      });
    });

    describe('[fails when]', () => {
      let response: Response;

      beforeAll(async () => {
        response = await request(application.getHttpServer())
          .post(`/${configuration.moduleOptions.route.forgotPassword}`)
          .send({ username: 'non-existent-user@email.dev' });
      });

      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' when a non-existing user's username is sent`, () => {
        expect(response.status).toBe(HttpStatus.NO_CONTENT);
      });
    });
  });
});
