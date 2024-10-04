import { Transporter } from 'nodemailer';
import Mailer from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { Mail } from './mail';

describe(Mail.name, () => {
  const sendMailResult = Symbol('`sendMail` result.');
  const transporter = {
    sendMail: jest.fn().mockResolvedValue(sendMailResult),
  } as unknown as jest.Mocked<Transporter<SMTPTransport.SentMessageInfo>>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    // From
    {
      key: 'from',
      value: { name: 'From User', address: 'from@email.dev' },
    } as MailerOption<'from'>,

    // To
    {
      key: 'to',
      value: { name: 'To User', address: 'to@email.dev' },
    } as MailerOption<'to'>,

    // Cc
    {
      key: 'cc',
      value: { name: 'Cc User', address: 'cc@email.dev' },
    } as MailerOption<'cc'>,

    // Bcc
    {
      key: 'bcc',
      value: { name: 'Bcc User', address: 'bcc@email.dev' },
    } as MailerOption<'bcc'>,

    // Subject
    {
      key: 'subject',
      value: 'Email Subject',
    } as MailerOption<'subject'>,

    // HTML
    {
      key: 'html',
      value: '<p>Hello, World!</p>',
    } as MailerOption<'html'>,

    // Text
    {
      key: 'text',
      value: 'Hello, World!',
    } as MailerOption<'text'>,
  ] as const)('$key', ({ key, value }) => {
    it(`assigns the provided value to the '${key}' option field`, () => {
      expect(new Mail(transporter)[key](value as any)['mailOptions'][key]).toBe(
        value,
      );
    });

    it("returns the current 'Mail' instance", () => {
      const mail = new Mail(transporter);

      expect(mail[key](value as any)).toBe(mail);
    });
  });

  describe(Mail.prototype.send.name, () => {
    const mailOptions: Mailer.Options = {};

    it("calls the transporter's `sendMail` method with the object's `mailOptions` object", async () => {
      await new Mail(transporter, mailOptions).send();

      expect(transporter.sendMail).toHaveBeenCalledTimes(1);
      expect(transporter.sendMail).toHaveBeenCalledWith(mailOptions);
    });

    it("returns the result of the transporter's `sendMail` method", async () => {
      await expect(new Mail(transporter, mailOptions).send()).resolves.toBe(
        sendMailResult,
      );
    });
  });

  describe(Mail.prototype.mjml.name, () => {
    const mailOptions: Mailer.Options = {};

    const messageTemplate = (variableName: string) => `Hello ${variableName}!`;
    const mjmlMustacheTemplate = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>
                ${messageTemplate('{{ user.name }}')}
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const mustacheVariables = { user: { name: 'One' } };
    const expectedEmailText = messageTemplate(mustacheVariables.user.name);

    beforeAll(() => {
      new Mail(transporter, mailOptions).mjml(
        mjmlMustacheTemplate,
        mustacheVariables,
      );
    });

    it('compiles a MJML + Mustache template & assigns it to the `html` option', () => {
      expect((mailOptions.html as string).includes(expectedEmailText)).toBe(
        true,
      );
    });

    it('converts the compiled HTML & assigns it to the `text` option', () => {
      expect((mailOptions.text as string).includes(expectedEmailText)).toBe(
        true,
      );
      expect(mailOptions.text as string).toHaveLength(expectedEmailText.length);
    });
  });
});

type MailerOption<Key extends keyof Mailer.Options> = {
  key: Key;
  value: NonNullable<Mailer.Options[Key]>;
};
