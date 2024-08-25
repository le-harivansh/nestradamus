import { Command, CommandRunner } from 'nest-commander';

import { DropCommand } from '../_drop/command/drop.command';
import { SeederCommand } from '../_seeder/command/seeder.command';

@Command({ name: 'db', subCommands: [SeederCommand, DropCommand] })
export class DatabaseCommand extends CommandRunner {
  override run(): Promise<void> {
    this.command.help();
  }
}
