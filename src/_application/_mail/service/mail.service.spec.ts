import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bull';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

import { MockOf } from '@/_library/helper';

import { MAIL_QUEUE, MailQueue, TRANSPORTER } from '../constant';
import { TemplateOptions } from '../helper';
import { MailService } from './mail.service';

// filesystem (node:fs) mock
jest.mock('node:fs', () => ({
  readFileSync: jest.fn((path: string) => ({
    toString: () => {
      const parsedPath = path.split('/');

      switch (parsedPath[parsedPath.length - 1]) {
        case 'mjml.template':
          return `
            <mjml>
              <mj-body>
                <mj-section>
                  <mj-column>
                    <mj-text>
                      Hello {{ user }}
                    </mj-text>
                  </mj-column>
                </mj-section>
              </mj-body>
            </mjml>
          `;
        case 'text.template':
          return 'The message is: {{ message }}.';
        default:
          throw new Error(`Invalid path (${path}) provided for the test.`);
      }
    },
  })),
}));

describe(MailService.name, () => {
  const transporter: MockOf<Transporter, 'sendMail'> = {
    sendMail: jest.fn(),
  };
  const mailQueue: MockOf<Queue, 'add'> = {
    add: jest.fn(),
  };

  let mailService: MailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TRANSPORTER,
          useValue: transporter,
        },
        {
          provide: getQueueToken(MAIL_QUEUE),
          useValue: mailQueue,
        },
        MailService,
      ],
    }).compile();

    mailService = module.get(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
  });

  describe('getTemplateContent', () => {
    it('calls `fs::readFileSync` with the provided path', () => {
      const path = 'mjml.template';

      MailService['getTemplateContent'](path);

      expect(readFileSync).toHaveBeenCalledTimes(1);
      expect(readFileSync).toHaveBeenCalledWith(
        join(process.cwd(), 'src', path),
      );
    });
  });

  describe('send', () => {
    const mailOptions: Mail.Options = {
      from: 'from@email.com',
      to: 'to@email.com',
      subject: 'The Subject',
      text: 'The text content of the email',
    };
    const htmlTemplateOptions: TemplateOptions = {
      template: `
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>
                  {{ admin.name }}
                </mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `,
      variables: {
        admin: {
          name: 'Admin.Seventy.Three',
        },
      },
    };

    it('calls `Transporter::sendMail` with the provided `Mail.Options` if the `html` and `text` parameters are not provided', async () => {
      await mailService.send(mailOptions);

      expect(transporter.sendMail).toHaveBeenCalledTimes(1);
      expect(transporter.sendMail).toHaveBeenCalledWith(mailOptions);
    });

    it('calls `Transporter.sendMail` with a compiled mjml template when a template path is provided', async () => {
      const html: TemplateOptions = {
        path: 'path/to/mjml.template',
        variables: { user: 'User.One.Two' },
      };

      await mailService.send(mailOptions, html);

      expect(
        transporter.sendMail.mock.calls[0][0].html.includes(
          (html.variables as { user: string }).user,
        ),
      ).toBeTruthy();
    });

    it('calls `Transporter.sendMail` with the provided compiled mjml template when a template string is provided', async () => {
      await mailService.send(mailOptions, htmlTemplateOptions);

      expect(
        transporter.sendMail.mock.calls[0][0].html.includes(
          (htmlTemplateOptions.variables as { admin: { name: string } }).admin
            .name,
        ),
      ).toBeTruthy();
    });

    it('transforms the provided template to text if no text version is provided', async () => {
      await mailService.send(mailOptions, htmlTemplateOptions);

      expect(
        transporter.sendMail.mock.calls[0][0].text.includes(
          (htmlTemplateOptions.variables as { admin: { name: string } }).admin
            .name,
        ),
      ).toBeTruthy();
    });

    it('calls `Transporter.sendMail` with a compiled text template when a template path is provided', async () => {
      const text: TemplateOptions = {
        path: 'path/to/text.template',
        variables: { message: 'This is the provided text message.' },
      };

      await mailService.send(mailOptions, undefined, text);

      expect(
        transporter.sendMail.mock.calls[0][0].text.includes(
          (text.variables as { message: string }).message,
        ),
      ).toBeTruthy();
    });

    it('calls `Transporter.sendMail` with the provided compiled text template when a template string is provided', async () => {
      const text: TemplateOptions = {
        template: 'Hello {{ user }}',
        variables: { user: 'Five.Six.Seven' },
      };

      await mailService.send(mailOptions, undefined, text);

      expect(
        transporter.sendMail.mock.calls[0][0].text.includes(
          (text.variables as { user: string }).user,
        ),
      ).toBeTruthy();
    });

    it('calls `Transporter.sendMail` with the provided compiled text template when a template string is provided - even if a mjml template was provided', async () => {
      const text: TemplateOptions = {
        template: 'Hello {{ user }}',
        variables: { user: 'Five.Six.Seven' },
      };

      await mailService.send(mailOptions, htmlTemplateOptions, text);

      expect(
        transporter.sendMail.mock.calls[0][0].text.includes(
          (text.variables as { user: string }).user,
        ),
      ).toBeTruthy();
    });
  });

  describe('queueSend', () => {
    it('calls `Queue::add` with the passed in arguments', async () => {
      const mailOptions: Mail.Options = {
        from: 'from@email.com',
        to: 'to@email.com',
        subject: 'The Subject',
        text: 'The text content of the email',
      };
      const html: TemplateOptions = { template: '<h1>Hello</h1>' };
      const text: TemplateOptions = {
        path: 'path/to/template.text.hbs',
        variables: { message: 'ok' },
      };

      await mailService.queueSend(mailOptions, html, text);

      expect(mailQueue.add).toHaveBeenCalledTimes(1);
      expect(mailQueue.add).toHaveBeenCalledWith(MailQueue.SEND_MAIL, {
        options: mailOptions,
        html,
        text,
      });
    });
  });
});
