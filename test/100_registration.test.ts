import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { RegistrationController } from '@/_registration/controller/registration.controller';
import { RegisterUserDto } from '@/_registration/dto/registration.dto';

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
      password: 'Le-P@ssw0rd',
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
      it.each<RegisterUserDto>([
        { username: '', password: '' },
        { username: 'ninetyOne', password: '' },
        { username: '', password: 'P@ssw0rd' },
        { username: 'one', password: 'P@ssw0rd' },
        { username: 'user', password: 'p@ssw0rd' },
        { username: 'user', password: 'P@SSW0RD' },
        { username: 'user', password: 'Passw0rd' },
        { username: 'user', password: 'P@ssword' },
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
