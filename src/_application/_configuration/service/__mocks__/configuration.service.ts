import ms from 'ms';

import { NamespacedConfiguration } from '../../type';

export function ConfigurationService(this: {
  getOrThrow(
    key: keyof NamespacedConfiguration,
  ): NamespacedConfiguration[typeof key];
}) {
  this.getOrThrow = jest.fn(
    (key: string) =>
      ({
        'application.name': 'Application',

        'authentication.jwt.accessToken.secret': 'access-token-secret',
        'authentication.jwt.accessToken.duration': ms('15 minutes'),

        'authentication.jwt.refreshToken.secret': 'refresh-token-secret',
        'authentication.jwt.refreshToken.duration': ms('1 week'),
      })[key]!,
  );
}
