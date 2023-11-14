import { NestFactory } from '@nestjs/core';
import chalk from 'chalk';

import { DatabaseSeeder } from '@/_application/_database/_seeder/seeder/database.seeder';
import { MainModule } from '@/main.module';

(async () => {
  const application = await NestFactory.createApplicationContext(MainModule, {
    logger: false,
  });
  const databaseSeeder = application.get(DatabaseSeeder);

  await application.init();

  console.log(`\n${chalk.cyan('Seeding the database...')}`);

  await databaseSeeder.run();

  console.log(chalk.green('Database seeding completed!'));

  await application.close();
})();
