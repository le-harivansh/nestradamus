import { HttpStatus, INestApplication } from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { DATABASE } from '../../src';
import { ROUTES, TEST_COLLECTION_NAME } from './helper/constant';
import { setupTestApplication, shutDownTestApplication } from './helper/setup';
import { User } from './helper/user.model';

describe('Route-Parameter Binding [id field resolution] (e2e)', () => {
  const user: User & { _id: ObjectId | null } = {
    _id: null,
    username: 'user@email.dev',
  };

  let application: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;

  beforeAll(async () => {
    ({ application, mongoMemoryServer } = await setupTestApplication());

    const database = application.get<Db>(DATABASE);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...userData } = user;

    ({ insertedId: user._id } = await database
      .collection(TEST_COLLECTION_NAME)
      .insertOne(userData));

    if (user._id === null) {
      throw new Error('Could not insert the test user in the database.');
    }
  });

  afterAll(async () => {
    await shutDownTestApplication(application, mongoMemoryServer);
  });

  describe.each([
    {
      type: 'implicit',
      route: `/${ROUTES.ID.IMPLICIT}`,
    },
    {
      type: 'explicit',
      route: `/${ROUTES.ID.EXPLICIT}`,
    },
  ])('- $type', ({ route }) => {
    describe('[succeeds because]', () => {
      it('resolves the specified model when it EXISTS in the database', async () => {
        const response = await request(application.getHttpServer()).get(
          `${route}/${user._id!.toString()}`,
        );

        expect(response.status).toBe(HttpStatus.OK);
      });
    });

    describe('[fails because]', () => {
      it(`returns HTTP ${HttpStatus.NOT_FOUND} error if the entity DOES NOT EXIST in the database`, async () => {
        const response = await request(application.getHttpServer()).get(
          `${route}/${new ObjectId().toString()}`,
        );

        expect(response.status).toBe(HttpStatus.NOT_FOUND);
      });
    });
  });
});
