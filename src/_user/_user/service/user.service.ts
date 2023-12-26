import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Document,
  FilterQuery,
  HydratedDocument,
  Model,
  Types,
} from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { User, UserSchema } from '../schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(UserService.name);
  }

  async create(userData: User): Promise<HydratedDocument<User>> {
    const newUser = await this.userModel.create(userData);

    this.loggerService.log('Created user', newUser);

    return newUser;
  }

  async findOne(id: Types.ObjectId): Promise<HydratedDocument<User>>;
  async findOne(
    filterQuery: FilterQuery<User>,
  ): Promise<HydratedDocument<User>>;
  async findOne(
    criteria: FilterQuery<User> | Types.ObjectId,
  ): Promise<HydratedDocument<User>> {
    let retrievedUser: HydratedDocument<User> | null;

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
    user: HydratedDocument<User>,
    updates: Partial<User>,
  ): Promise<HydratedDocument<User>>;
  async update(
    filterQuery: FilterQuery<User>,
    updates: Partial<User>,
  ): Promise<HydratedDocument<User>>;
  async update(
    documentOrFilterQuery: HydratedDocument<User> | FilterQuery<User>,
    updates: Partial<User>,
  ): Promise<HydratedDocument<User>> {
    let user: HydratedDocument<User> | null;

    if (
      documentOrFilterQuery instanceof Document &&
      documentOrFilterQuery.schema === UserSchema
    ) {
      user = documentOrFilterQuery;
    } else {
      user = await this.findOne(documentOrFilterQuery as FilterQuery<User>);
    }

    for (const [property, value] of Object.entries(updates)) {
      user.set(property, value);
    }

    const updatedUser = await user.save();

    this.loggerService.log('Updated user', updatedUser);

    return updatedUser;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const { deletedCount } = await this.userModel.deleteOne({ _id: id });

    if (deletedCount === 0) {
      throw new BadRequestException(
        `Could not delete the user with id: '${id.toString()}'.`,
      );
    }

    this.loggerService.log('Deleted user', { id });
  }
}
