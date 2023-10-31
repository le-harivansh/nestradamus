import { Module } from '@nestjs/common';

import { ApplicationModule } from './_application/application.module';
import { AuthenticationModule } from './_authentication/authentication.module';
import { RegistrationModule } from './_registration/registration.module';
import { UserModule } from './_user/user.module';

@Module({
  imports: [
    ApplicationModule,

    RegistrationModule,
    AuthenticationModule,
    UserModule,
  ],
})
export class MainModule {}
