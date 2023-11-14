import { Module } from '@nestjs/common';

import { ApplicationModule } from './_application/application.module';
import { AuthenticationModule } from './_authentication/authentication.module';
import { LibraryModule } from './_library/library.module';
import { RegistrationModule } from './_registration/registration.module';
import { UserModule } from './_user/user.module';

@Module({
  imports: [
    ApplicationModule,
    LibraryModule,

    RegistrationModule,
    AuthenticationModule,
    UserModule,
  ],
})
export class MainModule {}
