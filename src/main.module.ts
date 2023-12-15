import { Module } from '@nestjs/common';

import { ApplicationModule } from './_application/application.module';
import { LibraryModule } from './_library/library.module';
import { UserSection } from './_user/user.section';

@Module({
  imports: [ApplicationModule, LibraryModule, UserSection],
})
export class MainModule {}
