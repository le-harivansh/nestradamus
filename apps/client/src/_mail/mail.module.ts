import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MailModule as MailLibraryModule } from '@library/mail';

import { ConfigurationService } from '../_configuration/service/configuration.service';
import mailConfiguration from './mail.config';

@Module({
  imports: [
    ConfigModule.forFeature(mailConfiguration),
    MailLibraryModule.forRootAsync({
      inject: [ConfigurationService],
      useFactory: (configurationService: ConfigurationService) => ({
        host: configurationService.getOrThrow('mail.host'),
        port: configurationService.getOrThrow('mail.port'),

        authentication: {
          username: configurationService.getOrThrow(
            'mail.authentication.username',
          ),
          password: configurationService.getOrThrow(
            'mail.authentication.password',
          ),
        },

        default: {
          from: {
            name: configurationService.getOrThrow('mail.default.from.name'),
            address: configurationService.getOrThrow(
              'mail.default.from.address',
            ),
          },
        },
      }),

      isGlobal: true,
    }),
  ],
})
export class MailModule {}
