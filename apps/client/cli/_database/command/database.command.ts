import { Command, CommandRunner } from 'nest-commander';

import { DropCommand } from '../_drop/command/drop.command';
import { SeedCommand } from '../_seed/command/seed.command';

@Command({ name: 'db', subCommands: [SeedCommand, DropCommand] })
export class DatabaseCommand extends CommandRunner {
  override run(): Promise<void> {
    this.command.help();
  }
}
