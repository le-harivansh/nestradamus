import { Module } from '@nestjs/common';

import { AuthenticationModule } from './_authentication/authentication.module';
import { RegistrationModule } from './_registration/registration.module';
import { UserModule } from './_user/user.module';

@Module({
  imports: [UserModule, RegistrationModule, AuthenticationModule],
})
export class UserSection {}
