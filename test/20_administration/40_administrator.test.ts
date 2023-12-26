import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { AdministratorController } from '@/_administration/_administrator/controller/administrator.controller';
import { UpdateAdministratorDto } from '@/_administration/_administrator/dto/update-administrator.dto';
import { Administrator } from '@/_administration/_administrator/schema/administrator.schema';
import { RequiresAdministratorAccessToken } from '@/_administration/_authentication/guard/requires-administrator-access-token.guard';
import { HOST } from '@/_administration/constant';

import { createAdministrator } from '../helper/administrator';
import {
  setupTestApplication,
  teardownTestApplication,
} from '../helper/bootstrap';
import { Mailhog } from '../helper/mailhog';

describe(`${AdministratorController.name} (e2e)`, () => {
  const administratorData: Pick<Administrator, 'username' | 'password'> = {
    username: 'administrator@email.com',
    password: 'P@ssw0rd',
  };

  let start: Date;
  let application: INestApplication;
  let databaseConnection: Connection;
  let mailhog: Mailhog;

  let authenticationTokensData: {
    accessToken: { token: string; expiresAt: number };
    refreshToken: { token: string; expiresAt: number };
  };

  beforeAll(async () => {
    start = new Date();

    const {
      application: testApplication,
      databaseConnection: testDatabaseConnection,
      mailhog: testMailhog,
    } = await setupTestApplication();

    application = testApplication;
    databaseConnection = testDatabaseConnection;
    mailhog = testMailhog;

    /**
     * Create administrator & get authentication tokens
     */

    authenticationTokensData = await createAdministrator(
      {
        username: administratorData.username,
        password: administratorData.password,
      },
      databaseConnection,
      application.getHttpServer(),
      { login: true },
    );
  });

  afterAll(async () => {
    await teardownTestApplication(application, databaseConnection, {
      mailhog,
      start,
    });
  });

  describe('/me (GET)', () => {
    describe('[succeeds because]', () => {
      it('responds with a HTTP:OK status & the user-data when a correct `access-token` is provided', async () => {
        const { status, body } = await request(application.getHttpServer())
          .get('/me')
          .set('Host', HOST)
          .set(
            RequiresAdministratorAccessToken.HTTP_HEADER,
            authenticationTokensData.accessToken.token,
          );

        expect(status).toBe(HttpStatus.OK);
        expect(body).toStrictEqual({
          id: expect.any(String),
          username: administratorData.username,
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
            .set('Host', HOST)
            .set(RequiresAdministratorAccessToken.HTTP_HEADER, accessToken);

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });

  describe('/me (DELETE)', () => {
    describe('[succeeds because]', () => {
      const administratorToDelete = {
        data: {
          username: 'user.to.delete@email.com',
          password: 'P@ssw0rd',
        },
        authenticationTokens: {
          accessToken: { token: '', expiresAt: 0 },
        },
      };

      beforeEach(async () => {
        const authenticationTokens = await createAdministrator(
          {
            username: administratorToDelete.data.username,
            password: administratorToDelete.data.password,
          },
          databaseConnection,
          application.getHttpServer(),
          { login: true },
        );

        administratorToDelete.authenticationTokens.accessToken.token =
          authenticationTokens.accessToken.token;
        administratorToDelete.authenticationTokens.accessToken.expiresAt =
          authenticationTokens.accessToken.expiresAt;
      });

      it('responds with a HTTP:OK status & the user-data when a correct `access-token` is provided', async () => {
        const { status } = await request(application.getHttpServer())
          .delete('/me')
          .set('Host', HOST)
          .set(
            RequiresAdministratorAccessToken.HTTP_HEADER,
            administratorToDelete.authenticationTokens.accessToken.token,
          );

        expect(status).toBe(HttpStatus.NO_CONTENT);
      });

      it('cannot retrieve the user-data after it has been deleted', async () => {
        await request(application.getHttpServer())
          .delete('/me')
          .set('Host', HOST)
          .set(
            RequiresAdministratorAccessToken.HTTP_HEADER,
            administratorToDelete.authenticationTokens.accessToken.token,
          );

        const { status } = await request(application.getHttpServer())
          .get('/me')
          .set('Host', HOST)
          .set(
            RequiresAdministratorAccessToken.HTTP_HEADER,
            administratorToDelete.authenticationTokens.accessToken.token,
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
            .set('Host', HOST)
            .set(RequiresAdministratorAccessToken.HTTP_HEADER, accessToken);

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );
    });
  });

  describe('/me (PATCH)', () => {
    describe('[succeeds because]', () => {
      const administratorToUpdate: {
        data: Pick<Administrator, 'username' | 'password'>;
        authenticationTokens: {
          accessToken: { token: string; expiresAt: number };
        };
      } = {
        data: {
          username: 'user.to.update@email.com',
          password: 'P@ssw0rd',
        },
        authenticationTokens: {
          accessToken: { token: '', expiresAt: 0 },
        },
      };

      beforeEach(async () => {
        const authenticationTokens = await createAdministrator(
          {
            username: administratorToUpdate.data.username,
            password: administratorToUpdate.data.password,
          },
          databaseConnection,
          application.getHttpServer(),
          { login: true },
        );

        administratorToUpdate.authenticationTokens.accessToken.token =
          authenticationTokens.accessToken.token;
        administratorToUpdate.authenticationTokens.accessToken.expiresAt =
          authenticationTokens.accessToken.expiresAt;
      });

      afterEach(async () => {
        await request(application.getHttpServer())
          .delete('/me')
          .set('Host', HOST)
          .set(
            RequiresAdministratorAccessToken.HTTP_HEADER,
            administratorToUpdate.authenticationTokens.accessToken.token,
          );
      });

      it.each<UpdateAdministratorDto>([
        { email: 'updated@email.com' },
        { password: 'LeUpd@tedPassw0rd' },
        {
          email: 'another-updated@email.com',
          password: 'An0th3rUpdatedP@ssworD',
        },
      ])(
        'responds with a HTTP:OK status & the new administrator-data [email: $email, password: $password]',
        async (updateUserDto) => {
          const { status, body } = await request(application.getHttpServer())
            .patch('/me')
            .send(updateUserDto)
            .set('Host', HOST)
            .set(
              RequiresAdministratorAccessToken.HTTP_HEADER,
              administratorToUpdate.authenticationTokens.accessToken.token,
            );

          expect(status).toBe(HttpStatus.OK);
          expect(body).toMatchObject({
            id: expect.any(String),
            username:
              updateUserDto?.email ?? administratorToUpdate.data.username,
          });

          const { status: loginStatus } = await request(
            application.getHttpServer(),
          )
            .post('/login')
            .set('Host', HOST)
            .send({
              email: administratorToUpdate.data.username,
              password: administratorToUpdate.data.password,
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
            .set('Host', HOST)
            .set(RequiresAdministratorAccessToken.HTTP_HEADER, accessToken);

          expect(status).toBe(HttpStatus.UNAUTHORIZED);
        },
      );

      test.each<UpdateAdministratorDto>([
        // empty DTO
        {},
        // all empty fields
        { email: '', password: '' },
        // empty password field
        {
          email: 'updated-user@email.com',
          password: '',
        },
        // empty email field
        { email: '', password: 'P@ssw0rd' },
        // no uppercase character in password
        {
          email: 'updated-user@email.com',
          password: 'p@ssw0rd',
        },
        // no lowercase character in password
        {
          email: 'updated-user@email.com',
          password: 'P@SSW0RD',
        },
        // no special character in password
        {
          email: 'updated-user@email.com',
          password: 'Passw0rd',
        },
        // no number in password
        {
          email: 'updated-user@email.com',
          password: 'P@ssword',
        },
        // email already exists
        {
          email: administratorData.username,
          password: administratorData.password,
        },
        // value passed to the `_` arbiter property
        {
          _: 'this value should not be processed',
        } as unknown as UpdateAdministratorDto,
      ])(
        'invalid user data is provided to the request',
        async (updateUserDto) => {
          const { status } = await request(application.getHttpServer())
            .patch('/me')
            .send(updateUserDto)
            .set('Host', HOST)
            .set(
              RequiresAdministratorAccessToken.HTTP_HEADER,
              authenticationTokensData.accessToken.token,
            );

          expect(status).toBe(HttpStatus.BAD_REQUEST);
        },
      );
    });
  });
});
