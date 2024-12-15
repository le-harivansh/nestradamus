import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';

import { AuthenticationModule } from './_authentication/authentication.module';
import { AuthorizationModule } from './_authorization/authorization.module';
import { ConfigurationModule } from './_configuration/configuration.module';
import { ConfigurationService } from './_configuration/service/configuration.service';
import { DatabaseModule } from './_database/database.module';
import { HealthCheckModule } from './_health-check/health-check.module';
import { MailModule } from './_mail/mail.module';
import { PasswordConfirmationModule } from './_password-confirmation/password-confirmation.module';
import { PasswordResetModule } from './_password-reset/password-reset.module';
import { S3Module } from './_s3/s3.module';
import { UserModule } from './_user/user.module';
import applicationConfiguration from './application.config';

@Module({
  imports: [
    ConfigurationModule,
    ConfigModule.forFeature(applicationConfiguration),

    DatabaseModule,

    S3Module,

    MailModule,

    HealthCheckModule,

    UserModule,

    AuthenticationModule,

    PasswordConfirmationModule,

    PasswordResetModule,

    /**
     * Contains an `APP_GUARD` provider registration for `AuthorizationGuard`.
     */
    AuthorizationModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      inject: [ConfigurationService],
      useFactory: (configurationService: ConfigurationService) =>
        new ValidationPipe({
          whitelist: true,

          forbidNonWhitelisted: true,
          forbidUnknownValues: true,

          transformOptions: {
            exposeUnsetFields: false,
          },

          enableDebugMessages:
            configurationService.getOrThrow('application.environment') ===
            'development',
        }),
    },
  ],
})
export class ApplicationModule {}
