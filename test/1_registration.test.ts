import { HttpStatus, INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import { Connection } from 'mongoose';
import request from 'supertest';

import { ApplicationModule } from '../src/application.module';
import { RegisterUserDto } from '../src/registration/dto/registration.dto';
import { RegistrationController } from '../src/registration/registration.controller';

describe(`${RegistrationController.name} (e2e)`, () => {
  let application: INestApplication;
  let databaseConnection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();

    databaseConnection = moduleFixture.get(getConnectionToken());

    useContainer(application.select(ApplicationModule), {
      fallbackOnErrors: true,
    });

    await application.init();
  });

  afterAll(async () => {
    await databaseConnection.db.dropDatabase();

    await application.close();
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
