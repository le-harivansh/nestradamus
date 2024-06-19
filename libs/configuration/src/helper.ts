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
 *
 * This is used to create the type of the `ConfigurationService`.
 * We effectively register the namespaced configuration data - of every configuration that
 * we intend to retrieve from `ConfigurationService` - here.
 *
 * This is done as follows:
 * ```
 * export type NamespacedConfiguration =
 *  // Application
 *  FlattenedPrefixedConfiguration<
 *    typeof ApplicationConfigurationNamespace, // This refers to the namespace of the keys (e.g.: 'application')
 *    ApplicationConfiguration  // This refers to the type of the configuration object (e.g.: `{ name: string, port: number }`)
 *  > &
 *    // Database
 *    FlattenedPrefixedConfiguration<
 *      typeof DatabaseConfigurationNamespace,
 *      DatabaseConfiguration
 *    > & ...;
 *
 * // Result
 * type NamespacedConfiguration === {
 *    'application.name': string,
 *    'application.port': number,
 *    ...
 * }
 * ```
 */
export type FlattenedPrefixedConfiguration<
  Namespace extends string,
  Configuration extends object,
> = Flatten<PrefixedConfiguration<Namespace, Configuration>>;

type Flatten<T> = { [P in FlattenToPairs<T> as P[0]]: P[1] };

type PrefixedConfiguration<N extends string, C> = {
  [K in keyof C as K extends string ? `${N}.${K}` : never]: C[K] extends object
    ? K extends string
      ? PrefixedConfiguration<`${N}.${K}`, C[K]>
      : never
    : C[K];
};

type FlattenToPairs<T> = {
  [K in keyof T]: T[K] extends Value ? [K, T[K]] : FlattenToPairs<T[K]>;
}[keyof T] &
  [PropertyKey, Value];

/**
 * This type represents the possible types of values of environment variables.
 */
type Value = string | number | boolean;
