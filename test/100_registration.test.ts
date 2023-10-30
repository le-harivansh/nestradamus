import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { RegistrationController } from '../src/_registration/controller/registration.controller';
import { RegisterUserDto } from '../src/_registration/dto/registration.dto';
import { setupTestApplication, teardownTestApplication } from './helper';

describe(`${RegistrationController.name} (e2e)`, () => {
  let application: INestApplication;
  let databaseConnection: Connection;

  beforeAll(async () => {
    const {
      application: testApplication,
      databaseConnection: testDatabaseConnection,
    } = await setupTestApplication();

    application = testApplication;
    databaseConnection = testDatabaseConnection;
  });

  afterAll(async () => {
    await teardownTestApplication({
      application,
      databaseConnection,
    });
  });

  describe('/register (POST)', () => {
    const userData: RegisterUserDto = {
      username: 'le-user',
      password: 'le-password',
    };

    describe('[succeeds because]', () => {
      it("responds with HTTP:OK status & the created user's data", async () => {
        const { status, body } = await request(application.getHttpServer())
          .post('/register')
          .send(userData);

        expect(status).toBe(HttpStatus.CREATED);
        expect(body).toStrictEqual({
          id: expect.any(String),
          username: userData.username,
        });
      });
    });

    describe('[fails because]', () => {
      it.each([
        { username: '', password: '' },
        { username: 'ninetyOne', password: '' },
        { username: '', password: 'password' },
        { username: 'one', password: 'password' },
        { username: 'userino', password: 'pass' },
        userData,
      ])(
        "responds with HTTP:BAD_REQUEST if the provided user-data is invalid [username: '$username', password: '$password']",
        async ({ username, password }) => {
          const { status } = await request(application.getHttpServer())
            .post('/register')
            .send({ username, password });

          expect(status).toBe(HttpStatus.BAD_REQUEST);
        },
      );
    });
  });
});
