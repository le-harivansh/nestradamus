import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { seconds } from '@nestjs/throttler';

import { AuthenticationModule } from './_authentication/authentication.module';
import { DatabaseModule } from './_database/database.module';
import { HealthModule } from './_health/health.module';
import { RegistrationModule } from './_registration/registration.module';
import { UserModule } from './_user/user.module';
import applicationConfiguration, {
  ApplicationConfiguration,
} from './application.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      cache: process.env.NODE_ENV === 'production',
    }),
    ConfigModule.forFeature(applicationConfiguration),

    DatabaseModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: seconds(
            configService.getOrThrow<
              ApplicationConfiguration['rate-limiter']['ttl']
            >('application.rate-limiter.ttl'),
          ),
          limit: configService.getOrThrow<
            ApplicationConfiguration['rate-limiter']['limit']
          >('application.rate-limiter.limit'),
        },
      ],
    }),

    HealthModule,

    RegistrationModule,
    AuthenticationModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class ApplicationModule {}
