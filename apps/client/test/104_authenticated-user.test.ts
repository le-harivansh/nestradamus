import { HttpStatus, INestApplication } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import request from 'supertest';

import { LOGIN_ROUTE } from '../src/_authentication/constant';
import { AuthenticatedUserController } from '../src/_user/controller/authenticated-user.controller';
import { UpdateUserDto } from '../src/_user/dto/update-user.dto';
import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/application';
import {
  createUserAndGetAuthenticationCookies,
  deleteUser,
} from './helper/user';

describe(`${AuthenticatedUserController.name} (e2e)`, () => {
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
    let userWithReadPermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;
    let userWithoutReadPermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;

    beforeAll(async () => {
      [userWithReadPermission, userWithoutReadPermission] = await Promise.all([
        createUserAndGetAuthenticationCookies(
          { permissions: ['user:read:own'] },
          application,
        ),
        createUserAndGetAuthenticationCookies({}, application),
      ]);
    });

    afterAll(async () => {
      await Promise.all(
        [userWithReadPermission, userWithoutReadPermission].map(({ user }) =>
          deleteUser(user._id, application),
        ),
      );
    });

    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.OK}' with the current user's data - without the user's password`, async () => {
        const { status, body } = await request(application.getHttpServer())
          .get('/user')
          .set('Cookie', userWithReadPermission.cookies.accessToken);

        expect(status).toBe(HttpStatus.OK);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userData } = userWithReadPermission.user;

        expect(body).toStrictEqual({
          ...userData,
          _id: userData._id.toString(),
        });
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer()).get(
          '/user',
        );

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:read:own' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .get('/user')
          .set('Cookie', userWithoutReadPermission.cookies.accessToken);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });
    });
  });

  describe('PATCH /user', () => {
    let userToUpdateWithUpdatePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;
    let userWithUpdatePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;
    let userWithoutUpdatePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;

    beforeAll(async () => {
      [
        userToUpdateWithUpdatePermission,
        userWithUpdatePermission,
        userWithoutUpdatePermission,
      ] = await Promise.all([
        createUserAndGetAuthenticationCookies(
          { permissions: ['user:update:own'] },
          application,
        ),
        createUserAndGetAuthenticationCookies(
          { permissions: ['user:update:own'] },
          application,
        ),
        createUserAndGetAuthenticationCookies({}, application),
      ]);
    });

    afterAll(async () => {
      await Promise.all(
        [
          userToUpdateWithUpdatePermission,
          userWithUpdatePermission,
          userWithoutUpdatePermission,
        ].map(({ user }) => deleteUser(user._id, application)),
      );
    });

    describe('[succeeds because]', () => {
      it.each<UpdateUserDto>([
        { firstName: 'UpdatedFirstName' },
        { lastName: 'UpdatedLastName' },
        { permissions: ['user:update:own', 'user:read:own'] },
      ])(
        `returns 'HTTP ${HttpStatus.OK}' with the updated user's (non-credentials) data - without the user's password`,
        async (updatedUserData) => {
          const { status, body } = await request(application.getHttpServer())
            .patch('/user')
            .set('Cookie', [
              userToUpdateWithUpdatePermission.cookies.accessToken,
              userToUpdateWithUpdatePermission.cookies.confirmPassword,
            ])
            .send(updatedUserData);

          expect(status).toBe(HttpStatus.OK);

          const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            password: _authenticatedUserPassword,
            ...authenticatedUserData
          } = userToUpdateWithUpdatePermission.user;

          expect(body).toMatchObject({
            _id: authenticatedUserData._id.toString(),
            ...updatedUserData,
          });
        },
      );

      it('successfully updates the user credentials', async () => {
        const newCredentials = {
          email: 'updated-user@email.dev',
          password: 'Updated-P@ssw0rd',
        };

        const { status: updateStatus } = await request(
          application.getHttpServer(),
        )
          .patch('/user')
          .set('Cookie', [
            userToUpdateWithUpdatePermission.cookies.accessToken,
            userToUpdateWithUpdatePermission.cookies.confirmPassword,
          ])
          .send(newCredentials);

        expect(updateStatus).toBe(HttpStatus.OK);

        const { status: loginStatus } = await request(
          application.getHttpServer(),
        )
          .post(`/${LOGIN_ROUTE}`)
          .send({
            username: newCredentials.email,
            password: newCredentials.password,
          });

        expect(loginStatus).toBe(HttpStatus.NO_CONTENT);
      });
    });

    describe('[fails because]', () => {
      const userUpdateData: UpdateUserDto = {
        firstName: 'Updated FirstName',
        lastName: 'Updated LastName',
      };

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/user')
          .send(userUpdateData);

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user does not have the password-confirmation cookie`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/user')
          .set('Cookie', userWithUpdatePermission.cookies.accessToken)
          .send(userUpdateData);

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:update:own' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch('/user')
          .set('Cookie', [
            userWithoutUpdatePermission.cookies.accessToken,
            userWithoutUpdatePermission.cookies.confirmPassword,
          ])
          .send(userUpdateData);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });

      it.each<() => UpdateUserDto>([
        // We use callbacks here because some necessary variables are still uninitialized at this point.

        () => ({ firstName: '' }), // empty string
        () => ({ lastName: '' }), // empty string

        () => ({ email: '' }), // empty string
        () => ({ email: 'invalid-email' }), // invalid email
        () => ({ email: userWithUpdatePermission.user.email }), // existing email

        () => ({ password: '' }), // empty string
        () => ({ password: 'P@s5' }), // less than min-length
        () => ({ password: 'p@ssw0rd' }), // no uppercase
        () => ({ password: 'P@SSW0RD' }), // no lowercase
        () => ({ password: 'P@ssword' }), // no numbers
        () => ({ password: 'Passw0rd' }), // no special characters
      ])(
        `returns 'HTTP ${HttpStatus.BAD_REQUEST}' if invalid data is sent`,
        async (getUserUpdateData) => {
          const { status } = await request(application.getHttpServer())
            .patch('/user')
            .set('Cookie', [
              userWithUpdatePermission.cookies.accessToken,
              userWithUpdatePermission.cookies.confirmPassword,
            ])
            .send(getUserUpdateData());

          expect(status).toBe(HttpStatus.BAD_REQUEST);
        },
      );
    });
  });

  describe('DELETE /user', () => {
    let userToDeleteWithDeletePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;
    let userWithDeletePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;
    let userWithoutDeletePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;

    beforeAll(async () => {
      [
        userToDeleteWithDeletePermission,
        userWithDeletePermission,
        userWithoutDeletePermission,
      ] = await Promise.all([
        createUserAndGetAuthenticationCookies(
          { permissions: ['user:delete:own'] },
          application,
        ),
        createUserAndGetAuthenticationCookies(
          { permissions: ['user:delete:own'] },
          application,
        ),
        createUserAndGetAuthenticationCookies({}, application),
      ]);
    });

    afterAll(async () => {
      await Promise.all(
        /**
         * `userToDeleteWithDeletePermission` is already deleted during the
         * 'success' test, and therefore, does not have to be deleted.
         */
        [userWithDeletePermission, userWithoutDeletePermission].map(
          ({ user }) => deleteUser(user._id, application),
        ),
      );
    });

    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}'`, async () => {
        const { status } = await request(application.getHttpServer())
          .delete('/user')
          .set('Cookie', [
            userToDeleteWithDeletePermission.cookies.accessToken,
            userToDeleteWithDeletePermission.cookies.confirmPassword,
          ]);

        expect(status).toBe(HttpStatus.NO_CONTENT);
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer()).delete(
          '/user',
        );

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is authenticated, but lacks the password-confirmation cookie`, async () => {
        const { status } = await request(application.getHttpServer())
          .delete('/user')
          .set('Cookie', userWithDeletePermission.cookies.accessToken);

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:delete:own' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .delete('/user')
          .set('Cookie', [
            userWithoutDeletePermission.cookies.accessToken,
            userWithoutDeletePermission.cookies.confirmPassword,
          ]);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });
    });
  });
});
