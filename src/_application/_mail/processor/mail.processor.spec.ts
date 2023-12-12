import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import Mail from 'nodemailer/lib/mailer';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { TemplateOptions } from '../helper';
import { MailService } from '../service/mail.service';
import { MailProcessor } from './mail.processor';

jest.mock('../service/mail.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(MailProcessor.name, () => {
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let mailService: jest.Mocked<MailService>;
  let mailProcessor: MailProcessor;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WinstonLoggerService, MailService, MailProcessor],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    mailService = module.get(MailService);
    mailProcessor = module.get(MailProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mailProcessor).toBeDefined();
  });

  describe('sendMail', () => {
    const mailOptions: Mail.Options = {
      from: 'from@email.com',
      to: 'to@email.com',
      subject: 'The Subject',
      text: 'The text content of the email',
    };
    const html: TemplateOptions = {
      template: '<h1>hello {{ location }}</h1>',
      variables: { location: 'world' },
    };
    const text: TemplateOptions = {
      path: 'path/to/text-template.text.hbs',
      variables: { message: 'hi there' },
    };

    beforeEach(async () => {
      await mailProcessor.sendMail({
        data: { options: mailOptions, html, text },
      } as Job);
    });

    it('calls `MailService::send` with the passed in arguments', async () => {
      expect(mailService.send).toHaveBeenCalledTimes(1);
      expect(mailService.send).toHaveBeenCalledWith(mailOptions, html, text);
    });

    it('calls `WinstonLoggerService::log` with the passed in job data', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Processing mail to be sent',
        mailOptions,
      );
    });
  });
});
