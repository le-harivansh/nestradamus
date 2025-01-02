import { PermissionAndRequestParameterObjectFrom } from '@library/authorization';

import { permissionsMap } from './permissions-map';

const PERMISSION_STRING_SEPARATOR = ':';

const permissions: (keyof PermissionAndRequestParameterObjectFrom<
  typeof permissionsMap,
  typeof PERMISSION_STRING_SEPARATOR
>)[] = [
  `test${PERMISSION_STRING_SEPARATOR}list`,
  `test${PERMISSION_STRING_SEPARATOR}read${PERMISSION_STRING_SEPARATOR}own`,
  `test${PERMISSION_STRING_SEPARATOR}read${PERMISSION_STRING_SEPARATOR}others`,
  `test${PERMISSION_STRING_SEPARATOR}update`,
];

export const testUser: Readonly<TestUser> = {
  id: '1234567890',
  email: 'user@email.dev',
  password: 'password',
  permissions,
};

export interface TestUser {
  id: string;
  email: string;
  password: string;
  permissions: string[];
}
