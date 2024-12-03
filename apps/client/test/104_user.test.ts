import { HttpStatus, INestApplication } from '@nestjs/common';
import { Db, MongoClient, WithId } from 'mongodb';
import request from 'supertest';

import { UserController } from '../src/_user/controller/user.controller';
import { UpdateGeneralUserDataDto } from '../src/_user/dto/update-general-user-data.dto';
import { UpdateUserEmailDto } from '../src/_user/dto/update-user-email.dto';
import { UpdateUserPasswordDto } from '../src/_user/dto/update-user-password.dto';
import { User } from '../src/_user/schema/user.schema';
import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/application';
import {
  createUserAndGetAuthenticationCookies,
  deleteUser,
} from './helper/user';

describe(`${UserController.name} (e2e)`, () => {
  let application: INestApplication;

  let mongoClient: MongoClient;
  let database: Db;

  beforeAll(async () => {
    const testApplication = await setupTestApplication();

    ({ application, mongoClient, database } = testApplication);
  });

  afterAll(async () => {
    await teardownTestApplication(application, mongoClient, database);
  });

  describe('GET /user', () => {
    describe('[succeeds because]', () => {
      let user: WithId<User>;
      let accessTokenCookie: string;

      beforeAll(async () => {
        ({
          user,
          cookies: { accessToken: accessTokenCookie },
        } = await createUserAndGetAuthenticationCookies(
          {
            email: 'user@email.dev',
            password: 'P@ssw0rd',
            permissions: ['user:read:own'],
          },
          application,
        ));
      });

      afterAll(async () => {
        await deleteUser(user._id, application);
      });

      it(`returns 'HTTP ${HttpStatus.OK}' with the current user's data - without the user's password`, async () => {
        const { status, body } = await request(application.getHttpServer())
          .get('/user')
          .set('Cookie', accessTokenCookie);

        expect(status).toBe(HttpStatus.OK);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userData } = user;

        expect(body).toStrictEqual({
          ...userData,
          _id: userData._id.toString(),
        });
      });
    });

    describe('[fails because]', () => {
      let user: WithId<User>;
      let accessTokenCookie: string;

      beforeAll(async () => {
        ({
          user,
          cookies: { accessToken: accessTokenCookie },
        } = await createUserAndGetAuthenticationCookies(
          { email: 'user@email.dev', password: 'P@ssw0rd' },
          application,
        ));
      });

      afterAll(async () => {
        await deleteUser(user._id, application);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer()).get(
          '/user',
        );

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:read:own' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .get('/user')
          .set('Cookie', accessTokenCookie);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });
    });
  });

  describe('PATCH /user', () => {
    describe('[succeeds because]', () => {
      let user: WithId<User>;
      let accessTokenCookie: string;

      beforeAll(async () => {
        ({
          user,
          cookies: { accessToken: accessTokenCookie },
        } = await createUserAndGetAuthenticationCookies(
          {
            email: 'user@email.dev',
            password: 'P@ssw0rd',
            permissions: ['user:update:own'],
          },
          application,
        ));
      });

      afterAll(async () => {
        await deleteUser(user._id, application);
      });

      it(`returns 'HTTP ${HttpStatus.OK}' with the updated user's data - without the user's password`, async () => {
        const updatedUserData: UpdateGeneralUserDataDto = {
          firstName: 'Updated FirstName',
          lastName: 'Updated LastName',
        };

        const { status, body } = await request(application.getHttpServer())
          .patch('/user')
          .set('Cookie', accessTokenCookie)
          .send(updatedUserData);

        expect(status).toBe(HttpStatus.OK);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userData } = user;

        expect(body).toStrictEqual({
          ...userData,
          _id: userData._id.toString(),
          ...updatedUserData,
        });
      });
    });

    describe('[fails because]', () => {
      const updatedUserData: UpdateGeneralUserDataDto = {
        firstName: 'Updated FirstName',
        lastName: 'Updated LastName',
      };

      let user: WithId<User>;
      let accessTokenCookie: string;

      beforeAll(async () => {
        ({
          user,
          cookies: { accessToken: accessTokenCookie },
        } = await createUserAndGetAuthenticationCookies(
          { email: 'user@email.dev', password: 'P@ssw0rd' },
          application,
        ));
      });

      afterAll(async () => {
        await deleteUser(user._id, application);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/user')
          .send(updatedUserData);

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:update:own' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/user')
          .set('Cookie', accessTokenCookie)
          .send(updatedUserData);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });
    });
  });

  describe('PATCH /user/email', () => {
    describe('[succeeds because]', () => {
      let user: WithId<User>;
      let accessTokenCookie: string;
      let passwordConfirmationCookie: string;

      beforeAll(async () => {
        ({
          user,
          cookies: {
            accessToken: accessTokenCookie,
            confirmPassword: passwordConfirmationCookie,
          },
        } = await createUserAndGetAuthenticationCookies(
          {
            email: 'user@email.dev',
            password: 'P@ssw0rd',
            permissions: ['user:update:own'],
          },
          application,
        ));
      });

      afterAll(async () => {
        await deleteUser(user._id, application);
      });

      it(`returns 'HTTP ${HttpStatus.OK}' with the updated user's email - without the user's password`, async () => {
        const updatedUserEmail: UpdateUserEmailDto = {
          email: 'updated-user@email.dev',
        };

        const { status, body } = await request(application.getHttpServer())
          .patch('/user/email')
          .send(updatedUserEmail)
          .set('Cookie', [accessTokenCookie, passwordConfirmationCookie]);

        expect(status).toBe(HttpStatus.OK);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userData } = user;

        expect(body).toStrictEqual({
          ...userData,
          _id: userData._id.toString(),
          ...updatedUserEmail,
        });
      });
    });

    describe('[fails because]', () => {
      const updatedUserEmail: UpdateUserEmailDto = {
        email: 'updated-user@email.dev',
      };

      let userWithPermission: Awaited<
        ReturnType<typeof createUserAndGetAuthenticationCookies>
      >;
      let userWithoutPermission: Awaited<
        ReturnType<typeof createUserAndGetAuthenticationCookies>
      >;

      beforeAll(async () => {
        userWithPermission = await createUserAndGetAuthenticationCookies(
          {
            email: 'user-1@email.dev',
            password: 'P@ssw0rd-1',
            permissions: ['user:update:own'],
          },
          application,
        );
        userWithoutPermission = await createUserAndGetAuthenticationCookies(
          { email: 'user-2@email.dev', password: 'P@ssw0rd-2' },
          application,
        );
      });

      afterAll(async () => {
        await Promise.all(
          [userWithPermission, userWithoutPermission].map(({ user }) =>
            deleteUser(user._id, application),
          ),
        );
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/user/email')
          .send(updatedUserEmail);

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is authenticated, but lacks the password-confirmation cookie`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/user/email')
          .set('Cookie', userWithPermission.cookies.accessToken)
          .send(updatedUserEmail);

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:update:own' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/user/email')
          .set('Cookie', [
            userWithoutPermission.cookies.accessToken,
            userWithoutPermission.cookies.confirmPassword,
          ])
          .send(updatedUserEmail);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });
    });
  });

  describe('PATCH /user/password', () => {
    describe('[succeeds because]', () => {
      const updatedUserPassword: UpdateUserPasswordDto = {
        password: 'Upd@t3d-P@ssw0rd',
      };

      let user: WithId<User>;
      let accessTokenCookie: string;
      let passwordConfirmationCookie: string;

      beforeAll(async () => {
        ({
          user,
          cookies: {
            accessToken: accessTokenCookie,
            confirmPassword: passwordConfirmationCookie,
          },
        } = await createUserAndGetAuthenticationCookies(
          {
            email: 'user@email.dev',
            password: 'P@ssw0rd',
            permissions: ['user:update:own'],
          },
          application,
        ));
      });

      afterAll(async () => {
        await deleteUser(user._id, application);
      });

      it(`returns 'HTTP ${HttpStatus.OK}' without the user's password`, async () => {
        const { status, body } = await request(application.getHttpServer())
          .patch('/user/password')
          .send(updatedUserPassword)
          .set('Cookie', [accessTokenCookie, passwordConfirmationCookie]);

        expect(status).toBe(HttpStatus.OK);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userData } = user;

        expect(body).toStrictEqual({
          ...userData,
          _id: userData._id.toString(),
          // We should not expect the password here.
        });
      });
    });

    describe('[fails because]', () => {
      const updatedUserPassword: UpdateUserPasswordDto = {
        password: 'Upd@t3d-P@ssw0rd',
      };

      let userWithPermission: Awaited<
        ReturnType<typeof createUserAndGetAuthenticationCookies>
      >;
      let userWithoutPermission: Awaited<
        ReturnType<typeof createUserAndGetAuthenticationCookies>
      >;

      beforeAll(async () => {
        userWithPermission = await createUserAndGetAuthenticationCookies(
          {
            email: 'user-1@email.dev',
            password: 'P@ssw0rd-1',
            permissions: ['user:update:own'],
          },
          application,
        );
        userWithoutPermission = await createUserAndGetAuthenticationCookies(
          { email: 'user-2@email.dev', password: 'P@ssw0rd-2' },
          application,
        );
      });

      afterAll(async () => {
        await Promise.all(
          [userWithPermission, userWithoutPermission].map(({ user }) =>
            deleteUser(user._id, application),
          ),
        );
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/user/password')
          .send(updatedUserPassword);

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is authenticated, but lacks the password-confirmation cookie`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/user/password')
          .set('Cookie', userWithPermission.cookies.accessToken)
          .send(updatedUserPassword);

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:update:own' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/user/password')
          .set('Cookie', [
            userWithoutPermission.cookies.accessToken,
            userWithoutPermission.cookies.confirmPassword,
          ])
          .send(updatedUserPassword);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });
    });
  });

  describe('DELETE /user', () => {
    describe('[succeeds because]', () => {
      let accessTokenCookie: string;
      let passwordConfirmationCookie: string;

      beforeAll(async () => {
        ({
          cookies: {
            accessToken: accessTokenCookie,
            confirmPassword: passwordConfirmationCookie,
          },
        } = await createUserAndGetAuthenticationCookies(
          {
            email: 'user@email.dev',
            password: 'P@ssw0rd',
            permissions: ['user:delete:own'],
          },
          application,
        ));
      });

      /**
       * We do not have to delete the user after the test because it will
       * be deleted during the test.
       */

      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}'`, async () => {
        const { status } = await request(application.getHttpServer())
          .delete('/user')
          .set('Cookie', [accessTokenCookie, passwordConfirmationCookie]);

        expect(status).toBe(HttpStatus.NO_CONTENT);
      });
    });

    describe('[fails because]', () => {
      let userWithPermission: Awaited<
        ReturnType<typeof createUserAndGetAuthenticationCookies>
      >;
      let userWithoutPermission: Awaited<
        ReturnType<typeof createUserAndGetAuthenticationCookies>
      >;

      beforeAll(async () => {
        userWithPermission = await createUserAndGetAuthenticationCookies(
          {
            email: 'user-1@email.dev',
            password: 'P@ssw0rd-1',
            permissions: ['user:delete:own'],
          },
          application,
        );
        userWithoutPermission = await createUserAndGetAuthenticationCookies(
          { email: 'user-2@email.dev', password: 'P@ssw0rd-2' },
          application,
        );
      });

      afterAll(async () => {
        await Promise.all(
          [userWithPermission, userWithoutPermission].map(({ user }) =>
            deleteUser(user._id, application),
          ),
        );
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer()).delete(
          '/user',
        );

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is authenticated, but lacks the password-confirmation cookie`, async () => {
        const { status } = await request(application.getHttpServer())
          .delete('/user')
          .set('Cookie', userWithPermission.cookies.accessToken);

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:delete:own' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .delete('/user')
          .set('Cookie', [
            userWithoutPermission.cookies.accessToken,
            userWithoutPermission.cookies.confirmPassword,
          ]);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });
    });
  });
});
