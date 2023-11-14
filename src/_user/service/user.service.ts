import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ModelWithId } from '@/_library/helper';

import { User } from '../schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(data: User) {
    return (await this.userModel.create(data)).toObject();
  }

  async findOneBy(
    property: keyof ModelWithId<User>,
    value: ModelWithId<User>[keyof ModelWithId<User>],
  ) {
    const retrievedUser = await this.userModel
      .findOne({ [property]: value })
      .exec();

    if (!retrievedUser) {
      throw new NotFoundException(
        `Could not find the user with ${property}: '${value}'.`,
      );
    }

    return retrievedUser.toObject();
  }

  async update(id: string, data: Partial<User>) {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`Could not find the user with id: ${id}.`);
    }

    for (const [property, value] of Object.entries(data)) {
      user.set({ [property]: value });
    }

    return (await user.save()).toObject();
  }

  async delete(id: string) {
    const { deletedCount } = await this.userModel.deleteOne({ _id: id });

    if (deletedCount !== 1) {
      throw new NotFoundException(
        `Could not delete the user with id: '${id}'.`,
      );
    }
  }
}
