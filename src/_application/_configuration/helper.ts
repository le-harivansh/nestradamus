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
