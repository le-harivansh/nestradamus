import { Inject, Injectable } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import Mailer from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { MAIL_TRANSPORTER } from '../constant';
import { MAIL_MODULE_OPTIONS_TOKEN } from '../mail.module-definition';
import { MailModuleOptions } from '../mail.module-options';
import { Mail } from '../model/mail';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_TRANSPORTER)
    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>,

    @Inject(MAIL_MODULE_OPTIONS_TOKEN)
    private readonly mailModuleOptions: MailModuleOptions,
  ) {}

  mail(mailOptions?: Mailer.Options | undefined): Mail {
    return new Mail(this.transporter, {
      ...mailOptions,
      from: mailOptions?.from ?? this.mailModuleOptions.default.from,
    });
  }
}
