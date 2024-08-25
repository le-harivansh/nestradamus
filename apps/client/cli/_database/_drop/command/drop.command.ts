import { Inject } from '@nestjs/common';
import { Db } from 'mongodb';
import { CommandRunner, SubCommand } from 'nest-commander';

import { DATABASE } from '../../../../../../libs/database/src';

@SubCommand({ name: 'drop', description: 'Drop the client database.' })
export class DropCommand extends CommandRunner {
  constructor(@Inject(DATABASE) private readonly database: Db) {
    super();
  }

  override async run(): Promise<void> {
    await this.database.dropDatabase();
  }
}
