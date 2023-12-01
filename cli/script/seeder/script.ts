/**
 * This script seeds the database.
 *
 * If a new model needs to be seeded, you need to:
 *    1. Create a factory for the model to be seeded (see `src/_application/_user/factory/user.factory.ts`)
 *    2. Register the factory **and** mongoose schema in `_factory/factory.module.ts`
 *    3. Call the relevant factory method in `_seeder/seeder/database.seeder.ts`
 *
 * This script is meant to be run only in a development environment (i.e.: in an environment where `NODE_ENV` is set to `development`).
 */
import { NestFactory } from '@nestjs/core';
import chalk from 'chalk';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';

import { DatabaseSeeder } from '@cli/script/seeder/_seeder/seeder/database.seeder';

import { ApplicationModule } from './application.module';

(async () => {
  const application = await NestFactory.createApplicationContext(
    ApplicationModule,
    {
      logger: false,
    },
  );
  const databaseSeeder = application.get(DatabaseSeeder);
  const configurationService = application.get(ConfigurationService);

  if (
    configurationService.getOrThrow('application.environment') !== 'development'
  ) {
    throw new Error(
      'This script is only meant to be run in a development environment.',
    );
  }

  await application.init();

  console.log(`\n${chalk.cyan('Seeding the database...')}`);

  await databaseSeeder.run();

  console.log(chalk.green('Database seeding completed!'));

  await application.close();
})();
