import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ModelWithId } from '@/_library/helper';

import { User, UserDocument } from '../schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(
    email: User['email'],
    password: User['password'],
  ): Promise<UserDocument> {
    return this.userModel.create({ email, password });
  }

  async findOneBy(
    property: keyof ModelWithId<User>,
    value: ModelWithId<User>[keyof ModelWithId<User>],
  ): Promise<UserDocument> {
    const retrievedUser = await this.userModel
      .findOne({ [property]: value })
      .exec();

    if (!retrievedUser) {
      throw new NotFoundException(
        `Could not find the user with ${property}: '${value}'.`,
      );
    }

    return retrievedUser;
  }

  async update(
    id: Types.ObjectId,
    userData: Partial<User>,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(
        `Could not find the user with id: ${id.toString()}.`,
      );
    }

    for (const [property, value] of Object.entries(userData)) {
      user.set({ [property]: value });
    }

    return user.save();
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const { deletedCount } = await this.userModel.deleteOne({ _id: id });

    if (deletedCount !== 1) {
      throw new NotFoundException(
        `Could not delete the user with id: '${id.toString()}'.`,
      );
    }
  }
}
