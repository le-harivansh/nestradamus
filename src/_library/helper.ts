import { Require_id } from 'mongoose';

export type ModelWithId<T extends object> = Require_id<T>;

export type MockOf<T, P extends keyof T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in P]: T[K] extends Function ? jest.Mock<unknown> : T[P];
};
