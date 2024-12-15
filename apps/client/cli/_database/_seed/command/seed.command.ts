import { CommandRunner, SubCommand } from 'nest-commander';

import { UserSeeder } from '../seeder/user.seeder';

@SubCommand({ name: 'seed', description: 'Seed the client database.' })
export class SeedCommand extends CommandRunner {
  constructor(private readonly userSeeder: UserSeeder) {
    super();
  }

  override async run(): Promise<void> {
    await this.userSeeder.run();
  }
}
