import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { getAuthenticationTokens } from '@library/authentication/../test/helper/setup';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  LOGIN_ROUTE,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../../src/_authentication/constant';
import { PASSWORD_CONFIRMATION_COOKIE_NAME } from '../../src/_password-confirmation/constant';
import { User } from '../../src/_user/schema/user.schema';
import { UserService } from '../../src/_user/service/user.service';

export function fakeUserData(defaults?: Partial<User>): User {
  const PASSWORD = 'P@ssw0rd';

  return new User(
    defaults?.firstName ?? faker.person.firstName(),
    defaults?.lastName ?? faker.person.lastName(),
    defaults?.email ?? faker.internet.email(),
    defaults?.password ?? PASSWORD,
    defaults?.permissions ?? [],
  );
}

export function createUser(
  userData: Partial<User>,
  application: INestApplication,
) {
  const userService = application.get(UserService);

  return userService.create(fakeUserData(userData));
}

export function deleteUser(userId: ObjectId, application: INestApplication) {
  const userService = application.get(UserService);

  return userService.delete(userId);
}

export async function createUserAndGetAuthenticationCookies(
  { password = 'password', ...userData }: Partial<User>,
  application: INestApplication,
) {
  const user = await createUser(
    fakeUserData({ ...userData, password }),
    application,
  );

  const cookies = await getAuthenticationTokens(
    { username: user.email, password },
    application,
    `/${LOGIN_ROUTE}`,
    {
      accessToken: ACCESS_TOKEN_COOKIE_NAME,
      refreshToken: REFRESH_TOKEN_COOKIE_NAME,
      confirmPassword: PASSWORD_CONFIRMATION_COOKIE_NAME,
    },
  );

  return { user, cookies };
}
