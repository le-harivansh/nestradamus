import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from '../../../../_user/schema/user.schema';

@Injectable()
export class UserFactory {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  private getModelData(): User {
    return {
      username: faker.internet.userName(),
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
