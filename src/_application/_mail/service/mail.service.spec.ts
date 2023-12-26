import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bull';
import { readFileSync } from 'node:fs';
import { Transporter } from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';
import Mail from 'nodemailer/lib/mailer';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { MAIL_QUEUE, MailJob, TRANSPORTER } from '../constant';
import { TemplateOptions } from '../helper';
import { MailService } from './mail.service';

jest.mock('node:fs');
jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('@/_application/_configuration/service/configuration.service');

describe(MailService.name, () => {
  (readFileSync as jest.Mock).mockImplementation((path: string) => ({
    toString: () => {
      const parsedPath = path.split('/');

      switch (parsedPath[parsedPath.length - 1]) {
        case 'layout.mail.mjml.hbs':
        /**
         * The above case is needed because a 'layout' partial is defined in the
         * constructor of the `MailService`.
         */
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
  }));

  let loggerService: jest.Mocked<WinstonLoggerService>;
  let transporter: jest.Mocked<Transporter>;
  let mailQueue: jest.Mocked<Queue>;
  let mailService: MailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        WinstonLoggerService,
        {
          provide: TRANSPORTER,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: getQueueToken(MAIL_QUEUE),
          useValue: {
            add: jest.fn(),
          },
        },
        MailService,
      ],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    transporter = module.get(TRANSPORTER);
    mailQueue = module.get(getQueueToken(MAIL_QUEUE));
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
      expect(readFileSync).toHaveBeenCalledWith(path);
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
        (transporter.sendMail.mock.calls[0]![0] as MailOptions)
          .html!.toString()
          .includes((html.variables as { user: string }).user),
      ).toBeTruthy();
    });

    it('calls `Transporter.sendMail` with the provided compiled mjml template when a template string is provided', async () => {
      await mailService.send(mailOptions, htmlTemplateOptions);

      expect(
        (transporter.sendMail.mock.calls[0]![0] as MailOptions)
          .html!.toString()
          .includes(
            (htmlTemplateOptions.variables as { admin: { name: string } }).admin
              .name,
          ),
      ).toBeTruthy();
    });

    it('transforms the provided template to text if no text version is provided', async () => {
      await mailService.send(mailOptions, htmlTemplateOptions);

      expect(
        (transporter.sendMail.mock.calls[0]![0] as MailOptions)
          .text!.toString()
          .includes(
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
        (transporter.sendMail.mock.calls[0]![0] as MailOptions)
          .text!.toString()
          .includes((text.variables as { message: string }).message),
      ).toBeTruthy();
    });

    it('calls `Transporter.sendMail` with the provided compiled text template when a template string is provided', async () => {
      const text: TemplateOptions = {
        template: 'Hello {{ user }}',
        variables: { user: 'Five.Six.Seven' },
      };

      await mailService.send(mailOptions, undefined, text);

      expect(
        (transporter.sendMail.mock.calls[0]![0] as MailOptions)
          .text!.toString()
          .includes((text.variables as { user: string }).user),
      ).toBeTruthy();
    });

    it('calls `Transporter.sendMail` with the provided compiled text template when a template string is provided - even if a mjml template was provided', async () => {
      const text: TemplateOptions = {
        template: 'Hello {{ user }}',
        variables: { user: 'Five.Six.Seven' },
      };

      await mailService.send(mailOptions, htmlTemplateOptions, text);

      expect(
        (transporter.sendMail.mock.calls[0]![0] as MailOptions)
          .text!.toString()
          .includes((text.variables as { user: string }).user),
      ).toBeTruthy();
    });

    it('calls `WinstonLoggerService::log` with the passed in mail data', async () => {
      await mailService.send(mailOptions);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { html, text, ...mailOptionsToLog } = mailOptions;

      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith('Sending mail', {
        ...mailOptionsToLog,
      });
    });
  });

  describe('queueSend', () => {
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

    it('calls `Queue::add` with the passed in arguments', async () => {
      await mailService.queueSend(mailOptions, html, text);

      expect(mailQueue.add).toHaveBeenCalledTimes(1);
      expect(mailQueue.add).toHaveBeenCalledWith(MailJob.SEND_MAIL, {
        options: mailOptions,
        html,
        text,
      });
    });

    it('calls `WinstonLoggerService::log` with the passed in mail data', async () => {
      await mailService.queueSend(mailOptions);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { html, text, ...mailOptionsToLog } = mailOptions;

      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith('Queuing mail to send', {
        ...mailOptionsToLog,
      });
    });
  });
});
