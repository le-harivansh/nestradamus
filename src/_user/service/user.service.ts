import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from '../schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(userData: User) {
    return this.userModel.create(userData);
  }

  async findById(userId: string) {
    return this.userModel.findById(userId).exec();
  }

  async findByUsername(username: string) {
    return this.userModel.findOne({ username }).exec();
  }

  async updateUserWithId(userId: string, userData: Partial<User>) {
    const user = await this.userModel.findById(userId).exec();

    for (const [property, value] of Object.entries(userData)) {
      user[property] = value;
    }

    return user.save();
  }

  async deleteById(userId: string) {
    return this.userModel.findByIdAndDelete(userId).exec();
  }
}
