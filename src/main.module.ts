import { Module } from '@nestjs/common';

import { AdministrationSection } from './_administration/administration.section';
import { ApplicationModule } from './_application/application.module';
import { LibraryModule } from './_library/library.module';
import { UserSection } from './_user/user.section';

@Module({
  imports: [
    ApplicationModule,
    LibraryModule,
    AdministrationSection,
    UserSection,
  ],
})
export class MainModule {}
