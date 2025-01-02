import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { BASE_ROUTE as CONDITIONAL_AUTHORIZATION_BASE_ROUTE } from './helper/controller/conditional-authorization.controller';
import { testUser } from './helper/test-user';
import { TestModule } from './helper/test.module';

describe('Conditional-Authorization (e2e)', () => {
  let application: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    application = moduleFixture.createNestApplication();

    await application.init();
  });

  afterAll(async () => {
    await application.close();
  });

  describe('[succeeds because]', () => {
    it(`returns 'HTTP ${HttpStatus.OK}' when an authenticated user having the proper permission accesses a conditional-authorization-guarded route`, async () => {
      const response = await request(application.getHttpServer()).get(
        `/${CONDITIONAL_AUTHORIZATION_BASE_ROUTE}`,
      );

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`returns 'HTTP ${HttpStatus.OK}' when an authenticated user having the proper permission accesses a conditional-authorization-guarded route - with request parameters in the authorization callback - resolving to true`, async () => {
      const response = await request(application.getHttpServer()).patch(
        `/${CONDITIONAL_AUTHORIZATION_BASE_ROUTE}/creator/${testUser.id}`,
      );

      expect(response.status).toBe(HttpStatus.OK);
    });
  });

  describe('[fails because]', () => {
    it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' when an authenticated user having the proper permission accesses a conditional-authorization-guarded route which it does not have authorization to access`, async () => {
      const response = await request(application.getHttpServer()).delete(
        `/${CONDITIONAL_AUTHORIZATION_BASE_ROUTE}`,
      );

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
