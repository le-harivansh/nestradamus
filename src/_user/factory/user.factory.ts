import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../schema/user.schema';

/**
 * This is a factory class normally used during the seeding of the database.
 *
 * While it lives in the current module, it **SHOULD** generally be registered
 * in the factory module at `cli/script/seeder/_factory`.
 */
@Injectable()
export class UserFactory {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  private getData(): User {
    return {
      email: faker.internet.email(),
      password: 'password',
    };
  }

  async generate(count: number = 1): Promise<UserDocument[]> {
    return Promise.all(
      [...Array(count)].map(() => new this.userModel(this.getData()).save()),
    );
  }
}
