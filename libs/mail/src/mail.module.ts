import { Inject, Module } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { MAIL_TRANSPORTER } from './constant';
import {
  MAIL_MODULE_OPTIONS_TOKEN,
  MailConfigurableModuleClass,
} from './mail.module-definition';
import {
  MailModuleOptions,
  mailModuleOptionsValidationSchema,
} from './mail.module-options';
import { MailService } from './service/mail.service';

@Module({
  providers: [
    {
      provide: MAIL_TRANSPORTER,
      inject: [MAIL_MODULE_OPTIONS_TOKEN],
      useFactory: (
        mailModuleOptions: MailModuleOptions,
      ): Transporter<SMTPTransport.SentMessageInfo> =>
        createTransport({
          host: mailModuleOptions.host,
          port: mailModuleOptions.port,
          auth: {
            user: mailModuleOptions.authentication.username,
            pass: mailModuleOptions.authentication.password,
          },
          from: {
            name: mailModuleOptions.default.from.name,
            address: mailModuleOptions.default.from.address,
          },
        }),
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule extends MailConfigurableModuleClass {
  constructor(
    @Inject(MAIL_MODULE_OPTIONS_TOKEN) mailModuleOptions: MailModuleOptions,
  ) {
    super();

    // Validate the configuration object passed to the module.
    mailModuleOptionsValidationSchema.parse(mailModuleOptions);
  }

  /**
   * @todo: To reduce the spamminess of emails, do not forget to do the
   * following:
   *
   * 1. Setup SPF.
   * 2. Setup DKIM.
   * 3. Setup DMARC.
   *
   * 4. Add an unsubscribe button/link to the email.
   */
}
