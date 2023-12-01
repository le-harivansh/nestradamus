import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import Mail from 'nodemailer/lib/mailer';

import { MAIL_QUEUE, MailQueue } from '../constant';
import { TemplateOptions } from '../helper';
import { MailService } from '../service/mail.service';

@Processor(MAIL_QUEUE)
export class MailProcessor {
  constructor(private readonly mailService: MailService) {}

  @Process(MailQueue.SEND_MAIL)
  async sendMail({
    data: { options: mailOptions, html = undefined, text = undefined },
  }: Job<{
    options: Mail.Options;
    html?: TemplateOptions;
    text?: TemplateOptions;
  }>) {
    return this.mailService.send(mailOptions, html, text);
  }
}
