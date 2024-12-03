import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';

import { DATABASE, MONGO_CLIENT } from './constant';
import {
  DATABASE_MODULE_OPTIONS_TOKEN,
  DatabaseConfigurableModuleClass,
} from './database.module-definition';
import {
  DatabaseModuleOptions,
  databaseModuleOptionsValidationSchema,
} from './database.module-options';

@Module({
  providers: [
    {
      provide: MONGO_CLIENT,
      inject: [DATABASE_MODULE_OPTIONS_TOKEN],
      useFactory: ({
        scheme,
        host,
        port,
        username,
        password,
        applicationName,
      }: DatabaseModuleOptions): Promise<MongoClient> => {
        const mongoClient = new MongoClient(`${scheme}://${host}:${port}`, {
          appName: applicationName,
          auth: { username, password },
          authSource: 'admin',
        });

        return mongoClient.connect();
      },
    },
    {
      provide: DATABASE,
      inject: [DATABASE_MODULE_OPTIONS_TOKEN, MONGO_CLIENT],
      useFactory: (
        { databaseName }: DatabaseModuleOptions,
        mongoClient: MongoClient,
      ): Db => mongoClient.db(databaseName),
    },
  ],

  exports: [MONGO_CLIENT, DATABASE],
})
export class DatabaseModule
  extends DatabaseConfigurableModuleClass
  implements OnApplicationShutdown
{
  constructor(
    @Inject(DATABASE_MODULE_OPTIONS_TOKEN)
    databaseModuleOptions: DatabaseModuleOptions,

    @Inject(MONGO_CLIENT) private readonly mongoClient: MongoClient,
  ) {
    super();

    // Validate the database options passed to the module.
    databaseModuleOptionsValidationSchema.parse(databaseModuleOptions);
  }

  async onApplicationShutdown() {
    await this.mongoClient.close();
  }
}
