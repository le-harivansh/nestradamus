import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';

import { RequiresPasswordConfirmation } from '../src';
import { setupTestApplication } from './helper/setup';
import {
  TEST_BASE_ROUTE,
  UNAUTHENTICATED_ROUTE,
} from './helper/test.controller';
import { passwordConfirmationModuleOptions } from './helper/test.module';
import { testUser } from './helper/user';

describe(`${RequiresPasswordConfirmation.name} (e2e)`, () => {
  let application: INestApplication;

  beforeAll(async () => {
    application = await setupTestApplication();
  });

  afterAll(async () => {
    await application.close();
  });

  describe('[succeeds because]', () => {
    it("returns the correct HTTP success code when a guarded route has a valid 'password-confirmation' HTTP cookie", async () => {
      const passwordConfirmationResponse = await request(
        application.getHttpServer(),
      )
        .post(`/${passwordConfirmationModuleOptions.route}`)
        .send({
          password: testUser.password,
        });

      const passwordConfirmationCookie = passwordConfirmationResponse
        .get('Set-Cookie')
        .find((cookie) =>
          cookie.startsWith(passwordConfirmationModuleOptions.cookie.name),
        );

      expect(passwordConfirmationCookie).not.toBe(undefined);

      const response = await request(application.getHttpServer())
        .get(`/${TEST_BASE_ROUTE}`)
        .set('Cookie', passwordConfirmationCookie!);

      expect(response.status).toBe(HttpStatus.NO_CONTENT);
    });
  });

  describe('[fails because]', () => {
    it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the request is unauthenticated`, async () => {
      const response = await request(application.getHttpServer()).get(
        `/${TEST_BASE_ROUTE}/${UNAUTHENTICATED_ROUTE}`,
      );

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the authenticated request does not contain the 'password-confirmation' HTTP cookie`, async () => {
      const response = await request(application.getHttpServer()).get(
        `/${TEST_BASE_ROUTE}`,
      );

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
