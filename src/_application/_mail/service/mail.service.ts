import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import { convert } from 'html-to-text';
import mjml2html from 'mjml';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { QueueOf } from '@/_application/_queue/helper';

import { MAIL_QUEUE, MailQueue, TRANSPORTER } from '../constant';
import { TemplateOptions } from '../helper';
import { MailProcessor } from '../processor/mail.processor';

@Injectable()
export class MailService {
  constructor(
    @Inject(TRANSPORTER)
    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>,
    @InjectQueue(MAIL_QUEUE)
    private readonly mailQueue: QueueOf<MailProcessor>,
    private readonly loggerService: WinstonLoggerService,
    readonly configurationService: ConfigurationService,
  ) {
    this.loggerService.setContext(MailService.name);

    Handlebars.registerHelper('applicationName', () =>
      configurationService.getOrThrow('application.name'),
    );
    Handlebars.registerHelper('copyrightYear', () => new Date().getFullYear());

    Handlebars.registerPartial(
      'layout',
      MailService.getTemplateContent(
        join(__dirname, '..', 'template/layout.mail.mjml.hbs'),
      ),
    );
  }

  async send(
    mailOptions: Mail.Options,
    html?: TemplateOptions,
    text?: TemplateOptions,
  ) {
    let htmlString: string | undefined;

    if (html) {
      const mjmlTemplateString: string = html.path
        ? MailService.getTemplateContent(html.path)
        : html.template!;

      const mjmlString = Handlebars.compile(mjmlTemplateString)(html.variables);

      mailOptions.html = htmlString = mjml2html(mjmlString, {
        validationLevel: 'strict',
      }).html;
    }

    if (text) {
      const textTemplateString: string = text.path
        ? MailService.getTemplateContent(text.path)
        : text.template!;

      mailOptions.text = Handlebars.compile(textTemplateString)(text.variables);
    } else if (htmlString) {
      mailOptions.text = convert(htmlString);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { html: _html, text: _text, ...mailOptionsToLog } = mailOptions;

    this.loggerService.log('Sending mail', { ...mailOptionsToLog });

    return this.transporter.sendMail(mailOptions);
  }

  async queueSend(
    mailOptions: Mail.Options,
    html?: TemplateOptions,
    text?: TemplateOptions,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { html: _html, text: _text, ...mailOptionsToLog } = mailOptions;

    this.loggerService.log('Queuing mail to send', { ...mailOptionsToLog });

    return this.mailQueue.add(MailQueue.SEND_MAIL, {
      options: mailOptions,
      html,
      text,
    });
  }

  private static getTemplateContent(path: string): string {
    return readFileSync(path).toString();
  }
}
