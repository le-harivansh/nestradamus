/**
 * This script is used to seed data into the application.
 *
 * // @todo: log seeding status (e.g.: seeding completed, etc...)
 */
import { NestFactory } from '@nestjs/core';

import { DatabaseSeeder } from '../../src/_application/_database/_seeder/seeder/database.seeder';
import { MainModule } from '../../src/main.module';

(async () => {
  const application = await NestFactory.createApplicationContext(MainModule, {
    logger: false,
  });
  const databaseSeeder = application.get(DatabaseSeeder);

  await application.init();

  await databaseSeeder.run();

  await application.close();
})();
