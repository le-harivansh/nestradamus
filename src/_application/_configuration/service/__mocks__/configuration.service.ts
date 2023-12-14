import ms from 'ms';

import { NamespacedConfiguration } from '../../type';

export function ConfigurationService(this: {
  getOrThrow(
    key: keyof NamespacedConfiguration,
  ): NamespacedConfiguration[typeof key];
}) {
  this.getOrThrow = jest.fn(
    (key: keyof NamespacedConfiguration) =>
      (
        ({
          'application.name': 'Application',

          'user.authentication.jwt.accessToken.secret': 'access-token-secret',
          'user.authentication.jwt.accessToken.duration': ms('15 minutes'),

          'user.authentication.jwt.refreshToken.secret': 'refresh-token-secret',
          'user.authentication.jwt.refreshToken.duration': ms('1 week'),
        }) as Partial<NamespacedConfiguration>
      )[key]!,
  );
}
