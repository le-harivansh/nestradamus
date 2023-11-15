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
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };

    describe('[succeeds because]', () => {
      it("responds with HTTP:OK status & the created user's data", async () => {
        const { status, body } = await request(application.getHttpServer())
          .post('/register')
          .send(userData);

        expect(status).toBe(HttpStatus.CREATED);
        expect(body).toStrictEqual({
          id: expect.any(String),
          email: userData.email,
        });
      });
    });

    describe('[fails because]', () => {
      it.each<RegisterUserDto>([
        { email: '', password: '' }, // all empty fields
        { email: 'another-user@email.com', password: '' }, // empty password field
        { email: '', password: 'P@ssw0rd' }, // empty email field
        { email: 'another-user@email.com', password: 'p@ssw0rd' }, // no uppercase character in password
        { email: 'another-user@email.com', password: 'P@SSW0RD' }, // no lowercase character in password
        { email: 'another-user@email.com', password: 'Passw0rd' }, // no special character in password
        { email: 'another-user@email.com', password: 'P@ssword' }, // no number in password
        userData, // email already exists
      ])(
        "responds with HTTP:BAD_REQUEST if the provided user-data is invalid [email: '$email', password: '$password']",
        async ({ email, password }) => {
          const { status } = await request(application.getHttpServer())
            .post('/register')
            .send({ email, password });

          expect(status).toBe(HttpStatus.BAD_REQUEST);
        },
      );
    });
  });
});
