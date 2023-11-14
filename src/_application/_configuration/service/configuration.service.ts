import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DatabaseConfiguration,
  CONFIGURATION_NAMESPACE as databaseConfigurationNamespace,
} from '@/_application/_database/database.config';
import {
  ApplicationConfiguration,
  CONFIGURATION_NAMESPACE as applicationConfigurationNamespace,
} from '@/_application/application.config';
import {
  AuthenticationTokensConfiguration,
  CONFIGURATION_NAMESPACE as authenticationTokensConfigurationNamespace,
} from '@/_authentication/_token/token.config';

import { FlattenedPrefixedConfiguration } from '../helper';

/**
 * We register the namespaced configuration data - of every configuration that
 * we intend to retrieve from `ConfigurationService` - here.
 */
export type NamespacedConfiguration =
  // Application
  FlattenedPrefixedConfiguration<
    typeof applicationConfigurationNamespace,
    ApplicationConfiguration
  > &
    // Database
    FlattenedPrefixedConfiguration<
      typeof databaseConfigurationNamespace,
      DatabaseConfiguration
    > &
    // Authentication (jwt)
    FlattenedPrefixedConfiguration<
      typeof authenticationTokensConfigurationNamespace,
      AuthenticationTokensConfiguration
    >;

@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {}

  getOrThrow<T extends keyof NamespacedConfiguration>(key: T) {
    return this.configService.getOrThrow<NamespacedConfiguration[T]>(key);
  }
}
