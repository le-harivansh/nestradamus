import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Factory } from '@/_library/factory/abstract.factory';

import { User } from '../schema/user.schema';

@Injectable()
export class UserFactory extends Factory<User> {
  @InjectModel(User.name) readonly model!: Model<User>;

  getData(): User {
    return {
      username: faker.internet.email(),
      password: 'password',
    };
  }
}
