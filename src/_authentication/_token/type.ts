import { NamespacedConfiguration } from '@/_application/_configuration/type';

export type AuthenticationJwtPayload = { id: string };

export type JwtDurationConfigurationKey = keyof Pick<
  NamespacedConfiguration,
  | 'user.authentication.jwt.accessToken.duration'
  | 'user.authentication.jwt.refreshToken.duration'
>;

export type JwtSecretConfigurationKey = keyof Pick<
  NamespacedConfiguration,
  | 'user.authentication.jwt.accessToken.secret'
  | 'user.authentication.jwt.refreshToken.secret'
>;
