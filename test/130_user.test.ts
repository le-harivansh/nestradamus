import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { TokenHttpHeader } from '@/_authentication/constant';
import { UserController } from '@/_user/controller/user.controller';
import { UpdateUserDto } from '@/_user/dto/update-user.dto';
import { User } from '@/_user/schema/user.schema';

import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/bootstrap';
import { Mailhog } from './helper/mailhog';
import { registerUser } from './helper/user';

describe(`${UserController.name} (e2e)`, () => {
  const start = new Date();

  const userData: Pick<User, 'email' | 'password'> = {
    email: 'user@email.com',
    password: 'P@ssw0rd',
  };

  let application: INestApplication;
  let databaseConnection: Connection;
  let mailhog: Mailhog;

  let authenticationTokensData: {
    accessToken: { token: string; expiresAt: number };
    refreshToken: { token: string; expiresAt: number };
  };

  beforeAll(async () => {
    const {
      application: testApplication,
      databaseConnection: testDatabaseConnection,
    } = await setupTestApplication();

    application = testApplication;
    databaseConnection = testDatabaseConnection;

    /**
     * It is assumed that the mailhog service is being served from
     * the default host & port (`localhost:8025`)
     */
    mailhog = new Mailhog();

    /**
     * Create user & get user authentication tokens
     */

    authenticationTokensData = await registerUser(
      userData,
      {
        httpServer: application.getHttpServer(),
        mailhog,
      },
      { login: true },
    );
  });

  afterAll(async () => {
    await mailhog.deleteEmailsSentBetween(start, new Date());

    await teardownTestApplication({
      application,
      databaseConnection,
    });
  });

  describe('/me (GET)', () => {
    describe('[succeeds because]', () => {
      it('responds with a HTTP:OK status & the user-data when a correct `access-token` is provided', async () => {
        const { status, body } = await request(application.getHttpServer())
          .get('/me')
          .set(
            TokenHttpHeader.ACCESS_TOKEN,
            authenticationTokensData.accessToken.token,
          );

        expect(status).toBe(HttpStatus.OK);
        expect(body).toStrictEqual({
          id: expect.any(String),
          email: userData.email,
        });
      });
    });

    describe('[fails because]', () => {
      it.each<{ accessToken: string }>([
        { accessToken: '' },
        { accessToken: 'incorrect-access-token' },
      ])(
        "responds with a HTTP:UNAUTHORIZED status when an incorrect `access-token` is provided [access-token: '$accessToken']",
        async ({ accessToken }) => {
          const { status } = await request(application.getHttpServer())
            .get('/me')
            .set(TokenHttpHeader.ACCESS_TOKEN, accessToken);

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });

  describe('/me (DELETE)', () => {
    describe('[succeeds because]', () => {
      const userToDelete = {
        data: {
          email: 'user.to.delete@email.com',
          password: 'P@ssw0rd',
        },
        authenticationTokens: {
          accessToken: { token: '', expiresAt: 0 },
        },
      };

      beforeEach(async () => {
        const authenticationTokens = await registerUser(
          userToDelete.data,
          {
            httpServer: application.getHttpServer(),
            mailhog,
          },
          { login: true },
        );

        userToDelete.authenticationTokens.accessToken.token =
          authenticationTokens.accessToken.token;
        userToDelete.authenticationTokens.accessToken.expiresAt =
          authenticationTokens.accessToken.expiresAt;
      });

      it('responds with a HTTP:OK status & the user-data when a correct `access-token` is provided', async () => {
        const { status } = await request(application.getHttpServer())
          .delete('/me')
          .set(
            TokenHttpHeader.ACCESS_TOKEN,
            userToDelete.authenticationTokens.accessToken.token,
          );

        expect(status).toBe(HttpStatus.NO_CONTENT);
      });

      it('cannot retrieve the user-data after it has been deleted', async () => {
        await request(application.getHttpServer())
          .delete('/me')
          .set(
            TokenHttpHeader.ACCESS_TOKEN,
            userToDelete.authenticationTokens.accessToken.token,
          );

        const { status } = await request(application.getHttpServer())
          .get('/me')
          .set(
            TokenHttpHeader.ACCESS_TOKEN,
            userToDelete.authenticationTokens.accessToken.token,
          );

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('[fails because]', () => {
      it.each<{ accessToken: string }>([
        { accessToken: '' },
        { accessToken: 'incorrect-access-token' },
      ])(
        "responds with a HTTP:UNAUTHORIZED status when an incorrect `access-token` is provided [access-token: '$accessToken']",
        async ({ accessToken }) => {
          const { status } = await request(application.getHttpServer())
            .delete('/me')
            .set(TokenHttpHeader.ACCESS_TOKEN, accessToken);

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });

  describe('/me (PATCH)', () => {
    describe('[succeeds because]', () => {
      const userToUpdate = {
        data: {
          email: 'user.to.update@email.com',
          password: 'P@ssw0rd',
        },
        authenticationTokens: {
          accessToken: { token: '', expiresAt: 0 },
        },
      };

      beforeEach(async () => {
        const authenticationTokens = await registerUser(
          userToUpdate.data,
          {
            httpServer: application.getHttpServer(),
            mailhog,
          },
          { login: true },
        );

        userToUpdate.authenticationTokens.accessToken.token =
          authenticationTokens.accessToken.token;
        userToUpdate.authenticationTokens.accessToken.expiresAt =
          authenticationTokens.accessToken.expiresAt;
      });

      afterEach(async () => {
        await request(application.getHttpServer())
          .delete('/me')
          .set(
            TokenHttpHeader.ACCESS_TOKEN,
            userToUpdate.authenticationTokens.accessToken.token,
          );
      });

      it.each<UpdateUserDto>([
        { email: 'updated@email.com' },
        { password: 'LeUpd@tedPassw0rd' },
        {
          email: 'another-updated@email.com',
          password: 'An0th3rUpdatedP@ssworD',
        },
      ])(
        'responds with a HTTP:OK status & the new user-data [email: $email, password: $password]',
        async (updateUserDto) => {
          const { status, body } = await request(application.getHttpServer())
            .patch('/me')
            .send(updateUserDto)
            .set(
              TokenHttpHeader.ACCESS_TOKEN,
              userToUpdate.authenticationTokens.accessToken.token,
            );

          expect(status).toBe(HttpStatus.OK);
          expect(body).toMatchObject({
            id: expect.any(String),
            email: updateUserDto?.email ?? userToUpdate.data.email,
          });

          const { status: loginStatus } = await request(
            application.getHttpServer(),
          )
            .post('/login')
            .send({
              ...userToUpdate.data,
              ...updateUserDto,
            });

          expect(loginStatus).toBe(HttpStatus.OK);
        },
      );
    });

    describe('[fails because]', () => {
      it.each<{ accessToken: string }>([
        { accessToken: '' },
        { accessToken: 'incorrect-access-token' },
      ])(
        "responds with a HTTP:UNAUTHORIZED status when an incorrect `access-token` is provided [access-token: '$accessToken']",
        async ({ accessToken }) => {
          const { status } = await request(application.getHttpServer())
            .patch('/me')
            .send({
              email: 'new@email.com',
            })
            .set(TokenHttpHeader.ACCESS_TOKEN, accessToken);

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );

      it('fails when am empty dataset is provided', async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/me')
          .send({})
          .set(
            TokenHttpHeader.ACCESS_TOKEN,
            authenticationTokensData.accessToken.token,
          );

        expect(status).toBe(HttpStatus.BAD_REQUEST);
      });
    });
  });
});
