import { Module } from '@nestjs/common';

import { DropCommand } from './command/drop.command';

@Module({
  providers: [DropCommand],
})
export class DropModule {}
