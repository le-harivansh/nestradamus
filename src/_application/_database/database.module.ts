import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigurationService } from '../_configuration/service/configuration.service';
import { SeederModule } from './_seeder/seeder.module';
import databaseConfiguration, {
  DatabaseConfiguration,
} from './database.config';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfiguration),
    MongooseModule.forRootAsync({
      /**
       * If there is *more than* 1 connection, each connection should named.
       * However, for the sake of simplicity, if there is *only* 1 connection,
       * it should not be named, otherwise every model will need to registered
       * for that specific `connectionName`.
       */
      // connectionName: ConnectionName.DEFAULT,
      inject: [ConfigurationService],
      useFactory: (configurationService: ConfigurationService) => {
        const {
          host,
          port,
          username,
          password,
          name: databaseName,
        }: DatabaseConfiguration = {
          host: configurationService.getOrThrow('database.host'),
          port: configurationService.getOrThrow('database.port'),
          username: configurationService.getOrThrow('database.username'),
          password: configurationService.getOrThrow('database.password'),
          name: configurationService.getOrThrow('database.name'),
        };

        return {
          user: username,
          pass: password,
          uri: `mongodb://${host}:${port}`,
          dbName: databaseName,
        };
      },
    }),
  ],
})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const imports: Required<ModuleMetadata>['imports'] = [];

    /**
     * We use synchronous conditional imports within a dynamic module because
     * `ConditionalModule` returns a promise, and that interferes with e2e jest
     * tests. It prevents jest from exiting 1 second after the tests complete;
     * and that raises warnings.
     */
    if (process.env.NODE_ENV === 'development') {
      imports.push(SeederModule);
    }

    return {
      module: DatabaseModule,
      imports,
    };
  }
}
