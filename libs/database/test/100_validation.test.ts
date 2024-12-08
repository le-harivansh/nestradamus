import { HttpStatus, INestApplication } from '@nestjs/common';
import { Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { DATABASE } from '../src';
import {
  EXPLICIT_USERNAME_SHOULD_EXIST_ROUTE,
  EXPLICIT_USERNAME_SHOULD_NOT_EXIST_ROUTE,
  IMPLICIT_USERNAME_SHOULD_EXIST_ROUTE,
  IMPLICIT_USERNAME_SHOULD_NOT_EXIST_ROUTE,
  TEST_BASE_ROUTE,
  TEST_COLLECTION_NAME,
} from './helper/constant';
import { setupTestApplication, shutDownTestApplication } from './helper/setup';
import { User } from './helper/user.model';

describe('Entity Existence Validation (e2e)', () => {
  const existingUser: User = { username: 'user-1@email.dev' };

  let application: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;

  beforeAll(async () => {
    ({ application, mongoMemoryServer } = await setupTestApplication());

    const database = application.get<Db>(DATABASE);

    const { acknowledged } = await database
      .collection(TEST_COLLECTION_NAME)
      .insertOne(existingUser);

    if (!acknowledged) {
      throw new Error('Could not insert the test user in the database.');
    }
  });

  afterAll(async () => {
    await shutDownTestApplication(application, mongoMemoryServer);
  });

  it('is true', () => {
    expect(true).toBe(true);
  });

  describe.each([
    {
      type: 'implicit',
      route: `/${TEST_BASE_ROUTE}/${IMPLICIT_USERNAME_SHOULD_EXIST_ROUTE}`,
    },
    {
      type: 'explicit',
      route: `/${TEST_BASE_ROUTE}/${EXPLICIT_USERNAME_SHOULD_EXIST_ROUTE}`,
    },
  ])('Existence ($type)', ({ route }) => {
    describe('[succeeds because]', () => {
      it('returns the intended result when the entity EXISTS in the database', async () => {
        const response = await request(application.getHttpServer())
          .post(route)
          .send({
            username: existingUser.username,
          });

        expect(response.status).toBe(HttpStatus.NO_CONTENT);
      });
    });

    describe('[fails because]', () => {
      it(`returns HTTP ${HttpStatus.BAD_REQUEST} error if the entity DOES NOT EXIST in the database`, async () => {
        const response = await request(application.getHttpServer())
          .post(route)
          .send({
            username: 'not-a-user@email.dev',
          });

        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe.each([
    {
      type: 'implicit',
      route: `/${TEST_BASE_ROUTE}/${IMPLICIT_USERNAME_SHOULD_NOT_EXIST_ROUTE}`,
    },
    {
      type: 'explicit',
      route: `/${TEST_BASE_ROUTE}/${EXPLICIT_USERNAME_SHOULD_NOT_EXIST_ROUTE}`,
    },
  ])('Non-Existence ($type)', ({ route }) => {
    describe('[succeeds because]', () => {
      it('returns the intended result when the entity DOES NOT EXIST in the database', async () => {
        const response = await request(application.getHttpServer())
          .post(route)
          .send({
            username: 'not-a-user@email.dev',
          });

        expect(response.status).toBe(HttpStatus.NO_CONTENT);
      });
    });

    describe('[fails because]', () => {
      it(`returns HTTP ${HttpStatus.BAD_REQUEST} error if the entity EXISTS in the database`, async () => {
        const response = await request(application.getHttpServer())
          .post(route)
          .send({
            username: existingUser.username,
          });

        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      });
    });
  });
});
