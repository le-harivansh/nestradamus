import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { BASE_ROUTE } from './helper/controller/authorization.controller';
import { testUser } from './helper/test-user';
import { TestModule } from './helper/test.module';

describe('Authorization (e2e)', () => {
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
    it(`returns 'HTTP ${HttpStatus.OK}' when an authenticated user having the proper permission accesses an authorization-guarded route`, async () => {
      const response = await request(application.getHttpServer()).get(
        `/${BASE_ROUTE}`,
      );

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`returns 'HTTP ${HttpStatus.OK}' when an authenticated user having the proper permission accesses an authorization-guarded route - with request parameters in the authorization callback - resolving to true`, async () => {
      const response = await request(application.getHttpServer()).patch(
        `/${BASE_ROUTE}/creator/${testUser.id}`,
      );

      expect(response.status).toBe(HttpStatus.OK);
    });
  });

  describe('[fails because]', () => {
    it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' when an authenticated user having the proper permission accesses an authorization-guarded route which it does not have authorization to access`, async () => {
      const response = await request(application.getHttpServer()).get(
        `/${BASE_ROUTE}/others`,
      );

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' when an authenticated user does not have the proper permission to access an authorization-guarded route`, async () => {
      const response = await request(application.getHttpServer()).post(
        `/${BASE_ROUTE}`,
      );

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' when an authenticated user having the proper permission accesses an authorization-guarded route - with request parameters in the authorization callback - resolving to false`, async () => {
      const wrongCreatorId = '0987654321';
      const response = await request(application.getHttpServer()).patch(
        `/${BASE_ROUTE}/creator/${wrongCreatorId}`,
      );

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the request does not have an authenticated user attached to it`, async () => {
      const response = await request(application.getHttpServer()).delete(
        `/${BASE_ROUTE}`,
      );

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
