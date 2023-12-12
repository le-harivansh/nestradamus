import {
  DatabaseConfiguration,
  CONFIGURATION_NAMESPACE as databaseConfigurationNamespace,
} from '@/_application/_database/database.config';
import {
  MailConfiguration,
  CONFIGURATION_NAMESPACE as mailConfigurationNamespace,
} from '@/_application/_mail/mail.config';
import {
  QueueConfiguration,
  CONFIGURATION_NAMESPACE as queueConfigurationNamespace,
} from '@/_application/_queue/queue.config';
import {
  ApplicationConfiguration,
  CONFIGURATION_NAMESPACE as applicationConfigurationNamespace,
} from '@/_application/application.config';
import {
  AuthenticationTokensConfiguration,
  CONFIGURATION_NAMESPACE as authenticationTokensConfigurationNamespace,
} from '@/_authentication/_token/token.config';

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
    // Queue
    FlattenedPrefixedConfiguration<
      typeof queueConfigurationNamespace,
      QueueConfiguration
    > &
    // Authentication (JWT)
    FlattenedPrefixedConfiguration<
      typeof authenticationTokensConfigurationNamespace,
      AuthenticationTokensConfiguration
    > &
    // Mail
    FlattenedPrefixedConfiguration<
      typeof mailConfigurationNamespace,
      MailConfiguration
    >;

/**
 * This type represents the possible types of the values of environment
 * variables.
 */
type Value = string | number | boolean;

type FlattenToPairs<T> = {
  [K in keyof T]: T[K] extends Value ? [K, T[K]] : FlattenToPairs<T[K]>;
}[keyof T] &
  [PropertyKey, Value];

type Flatten<T> = { [P in FlattenToPairs<T> as P[0]]: P[1] };

type PrefixedConfiguration<N extends string, C> = {
  [K in keyof C as K extends string ? `${N}.${K}` : never]: C[K] extends object
    ? K extends string
      ? PrefixedConfiguration<`${N}.${K}`, C[K]>
      : never
    : C[K];
};

/**
 * This generic effectively prefixes a `Namespace` string to all the keys of
 * the provided `Configuration` object, while recursively flattening and
 * re-applying the namespace to the keys of any nested object.
 *
 * e.g.:
 * ```
 * const obj: FlattenedPrefixedConfiguration<'ONE', { a: number, b: { c: string, d: { e: boolean } } }> = {
 *    "ONE.a": 1,
 *    "ONE.b.c": "hi",
 *    "ONE.c.d.e": true
 * };
 * ```
 */
export type FlattenedPrefixedConfiguration<
  Namespace extends string,
  Configuration extends object,
> = Flatten<PrefixedConfiguration<Namespace, Configuration>>;
