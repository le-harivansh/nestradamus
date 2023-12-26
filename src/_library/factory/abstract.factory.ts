import { HydratedDocument, Model } from 'mongoose';

/**
 * This is factory class that should be extended by model factories.
 *
 * Its implementation is meant to be used during the seeding of said model
 * in the database.
 *
 * Note: The implementation **SHOULD** generally be registered in the factory
 * module at `cli/script/seeder/_factory`.
 */
export abstract class Factory<T> {
  abstract readonly model: Model<T>;

  /**
   * This method's only purpose is to return a pre-filled instance of the class
   * `T` on which the mongoose schema is based.
   */
  abstract getData(): T;

  async generate(count: number = 1): Promise<HydratedDocument<T>[]> {
    return Promise.all(
      [...Array(count)].map(() => this.model.create(this.getData())),
    );
  }
}
