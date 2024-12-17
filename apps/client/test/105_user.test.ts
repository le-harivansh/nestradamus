import { HttpStatus, INestApplication } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import request from 'supertest';

import { LOGIN_ROUTE } from '../src/_authentication/constant';
import { UserController } from '../src/_user/controller/user.controller';
import { CreateUserDto } from '../src/_user/dto/create-user.dto';
import { UpdateUserDto } from '../src/_user/dto/update-user.dto';
import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/application';
import {
  createUserAndGetAuthenticationCookies,
  deleteUser,
  fakeUserData,
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

  describe('GET /users', () => {
    let users: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >[];

    beforeAll(async () => {
      users = await Promise.all([
        createUserAndGetAuthenticationCookies(
          { permissions: ['user:list'] },
          application,
        ),
        createUserAndGetAuthenticationCookies({}, application),
        createUserAndGetAuthenticationCookies({}, application),
        createUserAndGetAuthenticationCookies({}, application),
      ]);
    });

    afterAll(async () => {
      await Promise.all(
        users.map(({ user }) => deleteUser(user._id, application)),
      );
    });

    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.OK}' with the specified number of users`, async () => {
        const userWithListPermission = users[0]!;

        const [skip, limit] = [1, 2];

        const { status, body } = await request(application.getHttpServer())
          .get(`/users?skip=${skip}&limit=${limit}`)
          .set('Cookie', userWithListPermission.cookies.accessToken);

        expect(status).toBe(HttpStatus.OK);

        expect(body).toStrictEqual({
          total: users.length,
          skip,
          limit,
          users: expect.any(Array),
        });

        for (const user of body.users) {
          expect(user).toStrictEqual({
            _id: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            email: expect.any(String),
            permissions: expect.any(Array),
          });
        }
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer()).get(
          '/users',
        );

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:list' permission`, async () => {
        const userWithoutListPermission = users[1]!;

        const { status } = await request(application.getHttpServer())
          .get('/users')
          .set('Cookie', userWithoutListPermission.cookies.accessToken);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });
    });
  });

  describe('GET /user/:id', () => {
    let userWithFullReadPermissions: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;
    let userWithOnlyOtherReadPermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;
    let userWithoutReadPermissions: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;

    beforeAll(async () => {
      [
        userWithFullReadPermissions,
        userWithOnlyOtherReadPermission,
        userWithoutReadPermissions,
      ] = await Promise.all([
        createUserAndGetAuthenticationCookies(
          { permissions: ['user:read:own', 'user:read:others'] },
          application,
        ),
        createUserAndGetAuthenticationCookies(
          { permissions: ['user:read:others'] },
          application,
        ),
        createUserAndGetAuthenticationCookies({}, application),
      ]);
    });

    afterAll(async () => {
      await Promise.all(
        [
          userWithFullReadPermissions,
          userWithOnlyOtherReadPermission,
          userWithoutReadPermissions,
        ].map(({ user }) => deleteUser(user._id, application)),
      );
    });

    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.OK}' with the queried user's data without the user's password`, async () => {
        const { status, body } = await request(application.getHttpServer())
          .get(`/user/${userWithOnlyOtherReadPermission.user._id.toString()}`)
          .set('Cookie', userWithFullReadPermissions.cookies.accessToken);

        expect(status).toBe(HttpStatus.OK);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userData } =
          userWithOnlyOtherReadPermission.user;

        expect(body).toStrictEqual({
          ...userData,
          _id: userData._id.toString(),
        });
      });

      it(`returns 'HTTP ${HttpStatus.OK}' if the authenticated user queries itself and it has the 'user:read:own' permission`, async () => {
        const { status, body } = await request(application.getHttpServer())
          .get(`/user/${userWithFullReadPermissions.user._id.toString()}`)
          .set('Cookie', userWithFullReadPermissions.cookies.accessToken);

        expect(status).toBe(HttpStatus.OK);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userData } = userWithFullReadPermissions.user;

        expect(body).toStrictEqual({
          ...userData,
          _id: userData._id.toString(),
        });
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer()).get(
          `/user/${userWithFullReadPermissions.user._id.toString()}`,
        );

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:read:others' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .get(`/user/${userWithFullReadPermissions.user._id.toString()}`)
          .set('Cookie', userWithoutReadPermissions.cookies.accessToken);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the authenticated user queries itself but it does not have the 'user:read:own' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .get(`/user/${userWithOnlyOtherReadPermission.user._id.toString()}`)
          .set('Cookie', userWithOnlyOtherReadPermission.cookies.accessToken);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });
    });
  });

  describe('POST /user', () => {
    let userWithCreatePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;
    let userWithoutCreatePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;

    beforeAll(async () => {
      [userWithCreatePermission, userWithoutCreatePermission] =
        await Promise.all([
          createUserAndGetAuthenticationCookies(
            { permissions: ['user:create'] },
            application,
          ),
          createUserAndGetAuthenticationCookies({}, application),
        ]);
    });

    afterAll(async () => {
      await Promise.all(
        [userWithCreatePermission, userWithoutCreatePermission].map(
          ({ user }) => deleteUser(user._id, application),
        ),
      );
    });

    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.CREATED}' with the new user's data - without the user's password`, async () => {
        const newUserData: CreateUserDto = fakeUserData();

        const { status, body } = await request(application.getHttpServer())
          .post('/user')
          .set('Cookie', userWithCreatePermission.cookies.accessToken)
          .send(newUserData);

        expect(status).toBe(HttpStatus.CREATED);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...newUserDataWithoutPassword } = newUserData;

        expect(body).toMatchObject({
          ...newUserDataWithoutPassword,
        });
      });
    });

    describe('[fails because]', () => {
      const newUserData: CreateUserDto = fakeUserData();

      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer())
          .post('/user')
          .send(newUserData);

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:create' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .post('/user')
          .set('Cookie', userWithoutCreatePermission.cookies.accessToken)
          .send(newUserData);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });

      it.each<Partial<CreateUserDto>>([
        { ...newUserData, firstName: '' },
        { ...newUserData, lastName: '' },
        { ...newUserData, email: '' },
        { ...newUserData, password: '' },
        { ...newUserData, permissions: ['invalid:permission'] },
      ])(
        `returns 'HTTP ${HttpStatus.BAD_REQUEST}' if invalid data is sent`,
        async (invalidUserData) => {
          const { status } = await request(application.getHttpServer())
            .post('/user')
            .set('Cookie', userWithCreatePermission.cookies.accessToken)
            .send(invalidUserData);

          expect(status).toBe(HttpStatus.BAD_REQUEST);
        },
      );
    });
  });

  describe('PATCH /user/:id', () => {
    let userWithUpdatePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;
    let userWithoutUpdatePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;

    beforeAll(async () => {
      [userWithUpdatePermission, userWithoutUpdatePermission] =
        await Promise.all([
          createUserAndGetAuthenticationCookies(
            { permissions: ['user:update:others'] },
            application,
          ),
          createUserAndGetAuthenticationCookies({}, application),
        ]);
    });

    afterAll(async () => {
      await Promise.all(
        [userWithUpdatePermission, userWithoutUpdatePermission].map(
          ({ user }) => deleteUser(user._id, application),
        ),
      );
    });

    describe('[succeeds because]', () => {
      it.each<UpdateUserDto>([
        { firstName: 'UpdatedFirstName' },
        { lastName: 'UpdatedLastName' },
        { permissions: ['user:read:own'] },
      ])(
        `returns 'HTTP ${HttpStatus.OK}' with the specified updated user's data - without the user's password`,
        async (updatedUserData) => {
          const { status, body } = await request(application.getHttpServer())
            .patch(`/user/${userWithoutUpdatePermission.user._id}`)
            .set('Cookie', [
              userWithUpdatePermission.cookies.accessToken,
              userWithUpdatePermission.cookies.confirmPassword,
            ])
            .send(updatedUserData);

          expect(status).toBe(HttpStatus.OK);

          const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            password: _,
            ...userData
          } = userWithoutUpdatePermission.user;

          expect(body).toMatchObject({
            _id: userData._id.toString(),
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
          .patch(`/user/${userWithoutUpdatePermission.user._id}`)
          .set('Cookie', [
            userWithUpdatePermission.cookies.accessToken,
            userWithUpdatePermission.cookies.confirmPassword,
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
          .patch(`/user/${userWithoutUpdatePermission.user._id}`)
          .send(userUpdateData);

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:update:others' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .patch(`/user/${userWithUpdatePermission.user._id}`)
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
            .patch(`/user/${userWithoutUpdatePermission.user._id}`)
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

  describe('DELETE /user/:id', () => {
    let userWithDeletePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;
    let userToDelete: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;
    let userWithoutDeletePermission: Awaited<
      ReturnType<typeof createUserAndGetAuthenticationCookies>
    >;

    beforeAll(async () => {
      [userWithDeletePermission, userToDelete, userWithoutDeletePermission] =
        await Promise.all([
          createUserAndGetAuthenticationCookies(
            { permissions: ['user:delete:others'] },
            application,
          ),
          createUserAndGetAuthenticationCookies({}, application),
          createUserAndGetAuthenticationCookies({}, application),
        ]);
    });

    afterAll(async () => {
      await Promise.all(
        /**
         * We only delete the users that have not been deleted by the tests.
         */
        [userWithDeletePermission, userWithoutDeletePermission].map(
          ({ user }) => deleteUser(user._id, application),
        ),
      );
    });

    describe('[succeeds because]', () => {
      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' if the user has 'user:delete:others' and tries to delete another user`, async () => {
        const { status } = await request(application.getHttpServer())
          .delete(`/user/${userToDelete.user._id.toString()}`)
          .set('Cookie', userWithDeletePermission.cookies.accessToken);

        expect(status).toBe(HttpStatus.NO_CONTENT);
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.UNAUTHORIZED}' if the user is unauthenticated`, async () => {
        const { status } = await request(application.getHttpServer()).delete(
          `/user/${userWithoutDeletePermission.user._id.toString()}`,
        );

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user does not have the 'user:delete:others' permission`, async () => {
        const { status } = await request(application.getHttpServer())
          .delete(`/user/${userWithoutDeletePermission.user._id.toString()}`)
          .set('Cookie', userWithoutDeletePermission.cookies.accessToken);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });

      it(`returns 'HTTP ${HttpStatus.FORBIDDEN}' if the user tries to delete itself`, async () => {
        const { status } = await request(application.getHttpServer())
          .delete(`/user/${userWithDeletePermission.user._id.toString()}`)
          .set('Cookie', userWithDeletePermission.cookies.accessToken);

        expect(status).toBe(HttpStatus.FORBIDDEN);
      });
    });
  });
});
