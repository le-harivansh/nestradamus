import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import Mail from 'nodemailer/lib/mailer';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { MAIL_QUEUE, MailJob } from '../constant';
import { TemplateOptions } from '../helper';
import { MailService } from '../service/mail.service';

@Processor(MAIL_QUEUE)
export class MailProcessor {
  constructor(
    private readonly mailService: MailService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(MailProcessor.name);
  }

  @Process(MailJob.SEND_MAIL)
  async sendMail({
    data: { options: mailOptions, html = undefined, text = undefined },
  }: Job<{
    options: Mail.Options;
    html?: TemplateOptions;
    text?: TemplateOptions;
  }>) {
    this.loggerService.log('Processing mail to be sent', mailOptions);

    return this.mailService.send(mailOptions, html, text);
  }
}
