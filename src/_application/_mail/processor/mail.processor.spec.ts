import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import Mail from 'nodemailer/lib/mailer';

import { MockOf } from '@/_library/helper';

import { TemplateOptions } from '../helper';
import { MailService } from '../service/mail.service';
import { MailProcessor } from './mail.processor';

describe(MailProcessor.name, () => {
  const mailService: MockOf<MailService, 'send'> = {
    send: jest.fn(),
  };

  let mailProcessor: MailProcessor;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: MailService,
          useValue: mailService,
        },
        MailProcessor,
      ],
    }).compile();

    mailProcessor = module.get(MailProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mailProcessor).toBeDefined();
  });

  describe('sendMail', () => {
    it('calls `MailService::send` with the passed in arguments', async () => {
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

      await mailProcessor.sendMail({
        data: { options: mailOptions, html, text },
      } as Job);

      expect(mailService.send).toHaveBeenCalledTimes(1);
      expect(mailService.send).toHaveBeenCalledWith(mailOptions, html, text);
    });
  });
});
