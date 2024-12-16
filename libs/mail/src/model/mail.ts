import { minify } from 'html-minifier';
import { convert as convertToText } from 'html-to-text';
import mjml2html from 'mjml';
import Mustache from 'mustache';
import { SentMessageInfo, Transporter } from 'nodemailer';
import Mailer from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export class Mail {
  constructor(
    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>,
    private readonly mailOptions: Mailer.Options = {},
  ) {}

  // [ ENVELOPE ]

  /**
   * Set the author of the e-mail.
   */
  from(from: NonNullable<Mailer.Options['from']>): this {
    this.mailOptions['from'] = from;

    return this;
  }

  /**
   * Set the sender of the e-mail.
   */
  sender(sender: NonNullable<Mailer.Options['sender']>): this {
    this.mailOptions['sender'] = sender;

    return this;
  }

  /**
   * Set the receiver(s) of the e-mail.
   */
  to(to: NonNullable<Mailer.Options['to']>): this {
    this.mailOptions['to'] = to;

    return this;
  }

  /**
   * Set the reply-address of the e-mail.
   */
  replyTo(replyTo: NonNullable<Mailer.Options['replyTo']>): this {
    this.mailOptions['replyTo'] = replyTo;

    return this;
  }

  /**
   * Set the carbon-copy receiver(s) of the e-mail.
   */
  cc(cc: NonNullable<Mailer.Options['cc']>): this {
    this.mailOptions['cc'] = cc;

    return this;
  }

  /**
   * Set the blind carbon-copy receiver(s) of the e-mail.
   */
  bcc(bcc: NonNullable<Mailer.Options['bcc']>): this {
    this.mailOptions['bcc'] = bcc;

    return this;
  }

  // [ SUBJECT ]

  /**
   * Set the subject of the e-mail.
   */
  subject(subject: NonNullable<Mailer.Options['subject']>): this {
    this.mailOptions['subject'] = subject;

    return this;
  }

  // [ BODY ]

  /**
   * Set the HTML body of the e-mail.
   */
  html(html: NonNullable<Mailer.Options['html']>): this {
    this.mailOptions['html'] = html;

    return this;
  }

  /**
   * Set the text body of the e-mail.
   */
  text(text: NonNullable<Mailer.Options['text']>): this {
    this.mailOptions['text'] = text;

    return this;
  }

  /**
   * Set the body of the e-mail as a MJML + Mustache template.
   * The result is compiled to HTML, minified, and set to the HTML field of the
   * e-mail.
   * It is then converted to text, and set to the text field of the e-mail.
   */
  mjml(
    mjmlMustacheTemplate: string,
    mustacheVariables: Record<string, unknown> = {},
  ): this {
    const mjmlTemplate = Mustache.render(
      mjmlMustacheTemplate,
      mustacheVariables,
    );

    const { html } = mjml2html(mjmlTemplate, {
      validationLevel: 'strict',
    });

    const minifiedHtml = minify(html, {
      collapseWhitespace: true,
      conservativeCollapse: true,
    });

    const minifiedText = convertToText(minifiedHtml);

    return this.html(minifiedHtml).text(minifiedText);
  }

  // [ SEND ]

  /**
   * Send the e-mail using the provided transporter.
   */
  send(): Promise<SentMessageInfo> {
    return this.transporter.sendMail(this.mailOptions);
  }
}
