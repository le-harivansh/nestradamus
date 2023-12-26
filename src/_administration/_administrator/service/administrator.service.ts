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

import {
  Administrator,
  AdministratorSchema,
} from '../schema/administrator.schema';

@Injectable()
export class AdministratorService {
  constructor(
    @InjectModel(Administrator.name)
    private readonly administratorModel: Model<Administrator>,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(AdministratorService.name);
  }

  async create(
    administratorData: Administrator,
  ): Promise<HydratedDocument<Administrator>> {
    const newAdministrator =
      await this.administratorModel.create(administratorData);

    this.loggerService.log('Created administrator', newAdministrator);

    return newAdministrator;
  }

  async findOne(id: Types.ObjectId): Promise<HydratedDocument<Administrator>>;
  async findOne(
    filterQuery: FilterQuery<Administrator>,
  ): Promise<HydratedDocument<Administrator>>;
  async findOne(
    criteria: FilterQuery<Administrator> | Types.ObjectId,
  ): Promise<HydratedDocument<Administrator>> {
    let retrievedAdministrator: HydratedDocument<Administrator> | null;

    if (criteria instanceof Types.ObjectId) {
      retrievedAdministrator = await this.administratorModel
        .findById(criteria)
        .exec();
    } else {
      retrievedAdministrator = await this.administratorModel
        .findOne(criteria)
        .exec();
    }

    if (!retrievedAdministrator) {
      throw new NotFoundException(
        `Could not find the administrator matching the filter-query: ${JSON.stringify(
          criteria,
        )}.`,
      );
    }

    this.loggerService.log('Queried administrator', retrievedAdministrator);

    return retrievedAdministrator;
  }

  async update(
    administrator: HydratedDocument<Administrator>,
    updates: Partial<Administrator>,
  ): Promise<HydratedDocument<Administrator>>;
  async update(
    filterQuery: FilterQuery<Administrator>,
    updates: Partial<Administrator>,
  ): Promise<HydratedDocument<Administrator>>;
  async update(
    documentOrFilterQuery:
      | HydratedDocument<Administrator>
      | FilterQuery<Administrator>,
    updates: Partial<Administrator>,
  ): Promise<HydratedDocument<Administrator>> {
    let administrator: HydratedDocument<Administrator> | null;

    if (
      documentOrFilterQuery instanceof Document &&
      documentOrFilterQuery.schema === AdministratorSchema
    ) {
      administrator = documentOrFilterQuery;
    } else {
      administrator = await this.findOne(
        documentOrFilterQuery as FilterQuery<Administrator>,
      );
    }

    for (const [property, value] of Object.entries(updates)) {
      administrator.set(property, value);
    }

    const updatedAdministrator = await administrator.save();

    this.loggerService.log('Updated administrator', updatedAdministrator);

    return updatedAdministrator;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const { deletedCount } = await this.administratorModel.deleteOne({
      _id: id,
    });

    if (deletedCount === 0) {
      throw new BadRequestException(
        `Could not delete the administrator with id: '${id.toString()}'.`,
      );
    }

    this.loggerService.log('Deleted administrator', { id });
  }
}
