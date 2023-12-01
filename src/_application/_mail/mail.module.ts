import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';

import { MAIL_QUEUE, TRANSPORTER } from './constant';
import { transporterFactory } from './factory/transporter.factory';
import mailConfiguration from './mail.config';
import { MailProcessor } from './processor/mail.processor';
import { MailService } from './service/mail.service';

@Module({
  imports: [
    ConfigModule.forFeature(mailConfiguration),
    BullModule.registerQueue({ name: MAIL_QUEUE }),
  ],
  providers: [
    {
      provide: TRANSPORTER,
      inject: [ConfigurationService],
      useFactory: transporterFactory,
    },
    MailService,
    MailProcessor,
  ],
  exports: [MailService],
})
export class MailModule {}
