import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from '../schema/user.schema';

/**
 * This is a factory class used during the seeding of the database.
 *
 * While it lives in the current module, it **should** be registered in the
 * factory module (@ src/_application/_database/_factory).
 */

@Injectable()
export class UserFactory {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  private getModelData(): User {
    return {
      email: faker.internet.email(),
      password: 'password',
    };
  }

  async generate(count: number = 1) {
    return Promise.all(
      [...Array(count).keys()].map(() =>
        new this.userModel(this.getModelData()).save(),
      ),
    );
  }
}
