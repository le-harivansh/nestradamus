import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';

import { AuthenticationModule } from './_authentication/authentication.module';
import { ConfigurationModule } from './_configuration/configuration.module';
import { DatabaseModule } from './_database/database.module';
import { HealthCheckModule } from './_health-check/health-check.module';
import { MailModule } from './_mail/mail.module';
import { PasswordResetModule } from './_password-reset/password-reset.module';
import { UserModule } from './_user/user.module';
import applicationConfiguration from './application.config';

@Module({
  imports: [
    ConfigurationModule,
    ConfigModule.forFeature(applicationConfiguration),

    DatabaseModule,

    MailModule,

    HealthCheckModule,

    UserModule,

    AuthenticationModule,

    PasswordResetModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class ApplicationModule {}
