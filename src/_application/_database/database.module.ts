import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigurationService } from '../_configuration/service/configuration.service';
import databaseConfiguration, {
  DatabaseConfiguration,
} from './database.config';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfiguration),
    MongooseModule.forRootAsync({
      /**
       * If there is *more than* 1 connection; each connection should named.
       * However, for the sake of simplicity, if there is *ONLY* 1 connection,
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
export class DatabaseModule {}
