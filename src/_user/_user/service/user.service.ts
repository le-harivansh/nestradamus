import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { User, UserDocument } from '../schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(UserService.name);
  }

  async create(email: string, password: string): Promise<UserDocument> {
    const newUser = await this.userModel.create({ email, password });

    this.loggerService.log('Created user', newUser);

    return newUser;
  }

  async findOne(id: Types.ObjectId): Promise<UserDocument>;
  async findOne(filterQuery: FilterQuery<User>): Promise<UserDocument>;
  async findOne(
    criteria: FilterQuery<User> | Types.ObjectId,
  ): Promise<UserDocument> {
    let retrievedUser: UserDocument | null;

    if (criteria instanceof Types.ObjectId) {
      retrievedUser = await this.userModel.findById(criteria).exec();
    } else {
      retrievedUser = await this.userModel.findOne(criteria).exec();
    }

    if (!retrievedUser) {
      throw new NotFoundException(
        `Could not find the user matching the filter-query: ${JSON.stringify(
          criteria,
        )}.`,
      );
    }

    this.loggerService.log('Queried user', retrievedUser);

    return retrievedUser;
  }

  async update(
    id: Types.ObjectId,
    updates: Partial<User>,
  ): Promise<UserDocument>;
  async update(
    filterQuery: FilterQuery<User>,
    updates: Partial<User>,
  ): Promise<UserDocument>;
  async update(
    criteria: FilterQuery<User> | Types.ObjectId,
    updates: Partial<User>,
  ): Promise<UserDocument> {
    const user = await this.findOne(criteria);

    for (const [property, value] of Object.entries(updates)) {
      user.set({ [property]: value });
    }

    const updatedUser = await user.save();

    this.loggerService.log('Updated user', updatedUser);

    return updatedUser;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const { deletedCount } = await this.userModel.deleteOne({ _id: id });

    if (deletedCount === 0) {
      throw new NotFoundException(
        `Could not delete the user with id: '${id.toString()}'.`,
      );
    }

    this.loggerService.log('Deleted user', { id });
  }
}
