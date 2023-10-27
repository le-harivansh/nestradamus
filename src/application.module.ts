import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import applicationConfiguration from './application.config';
import { AuthenticationModule } from './authentication/authentication.module';
import { DatabaseModule } from './database/database.module';
import { RegistrationModule } from './registration/registration.module';
import { UserModule } from './user/user.module';

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
