import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Factory } from '@/_library/factory/abstract.factory';

import { Administrator } from '../schema/administrator.schema';

@Injectable()
export class AdministratorFactory extends Factory<Administrator> {
  @InjectModel(Administrator.name) readonly model!: Model<Administrator>;

  getData(): Administrator {
    return {
      username: faker.internet.email(),
      password: 'password',
    };
  }
}
