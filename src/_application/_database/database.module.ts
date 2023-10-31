import { Module } from '@nestjs/common';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { SeederModule } from './_seeder/seeder.module';
import databaseConfiguration, {
  DatabaseConfiguration,
} from './database.config';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfiguration),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const {
          host,
          port,
          username,
          password,
          name: databaseName,
        }: DatabaseConfiguration = {
          host: configService.getOrThrow<DatabaseConfiguration['host']>(
            'database.host',
          ),
          port: configService.getOrThrow<DatabaseConfiguration['port']>(
            'database.port',
          ),
          username:
            configService.getOrThrow<DatabaseConfiguration['username']>(
              'database.username',
            ),
          password:
            configService.getOrThrow<DatabaseConfiguration['password']>(
              'database.password',
            ),
          name: configService.getOrThrow<DatabaseConfiguration['name']>(
            'database.name',
          ),
        };

        return {
          user: username,
          pass: password,
          uri: `mongodb://${host}:${port}`,
          dbName: databaseName,
        };
      },
    }),

    ConditionalModule.registerWhen(
      SeederModule,
      (env) => env['NODE_ENV'] === 'development',
    ),
  ],
})
export class DatabaseModule {}
