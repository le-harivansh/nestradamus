import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthenticationModule } from './_authentication/authentication.module';
import { DatabaseModule } from './_database/database.module';
import { RegistrationModule } from './_registration/registration.module';
import { UserModule } from './_user/user.module';
import applicationConfiguration from './application.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      cache: process.env.NODE_ENV === 'production',
    }),
    ConfigModule.forFeature(applicationConfiguration),

    DatabaseModule,

    RegistrationModule,
    AuthenticationModule,
    UserModule,
  ],
})
export class ApplicationModule {}
