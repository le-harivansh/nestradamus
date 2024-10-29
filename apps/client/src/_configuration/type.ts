import { FlattenedPrefixedConfiguration } from '@library/configuration';

import {
  DatabaseConfiguration,
  CONFIGURATION_NAMESPACE as DatabaseConfigurationNamespace,
} from '../_database/database.config';
import {
  MailConfiguration,
  CONFIGURATION_NAMESPACE as MailConfigurationNamespace,
} from '../_mail/mail.config';
import {
  PasswordResetConfiguration,
  CONFIGURATION_NAMESPACE as PasswordResetConfigurationNamespace,
} from '../_password-reset/password-reset.config';
import {
  ApplicationConfiguration,
  CONFIGURATION_NAMESPACE as ApplicationConfigurationNamespace,
} from '../application.config';

/**
 * We register the namespaced configuration data - of every configuration that
 * we intend to retrieve from `ConfigurationService` - here.
 */
export type NamespacedConfiguration =
  // Application
  FlattenedPrefixedConfiguration<
    typeof ApplicationConfigurationNamespace,
    ApplicationConfiguration
  > &
    // Database
    FlattenedPrefixedConfiguration<
      typeof DatabaseConfigurationNamespace,
      DatabaseConfiguration
    > &
    // Mail
    FlattenedPrefixedConfiguration<
      typeof MailConfigurationNamespace,
      MailConfiguration
    > &
    // Password-Reset
    FlattenedPrefixedConfiguration<
      typeof PasswordResetConfigurationNamespace,
      PasswordResetConfiguration
    >;
