/**
 * Returns a type where `T` and `U` are mutually exclusive.
 */
export type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

export type Constructor<T> = {
  new (...args: unknown[]): T;
};

export type PropertiesOfInstanceOfConstructor<T> = {
  [P in keyof InstanceOfConstructor<T>]: P extends string
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      InstanceOfConstructor<T>[P] extends Function
      ? never
      : P
    : never;
}[keyof InstanceOfConstructor<T>];

type InstanceOfConstructor<T> = T extends Constructor<infer U> ? U : never;
