import { FlattenedPrefixedConfiguration } from '@application/configuration';

import {
  DatabaseConfiguration,
  CONFIGURATION_NAMESPACE as DatabaseConfigurationNamespace,
} from '../_database/database.config';
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
    >;
