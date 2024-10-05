import { Test, TestingModule } from '@nestjs/testing';

import { MAIL_TRANSPORTER } from '../constant';
import { MAIL_MODULE_OPTIONS_TOKEN } from '../mail.module-definition';
import { MailService } from './mail.service';

describe(MailService.name, () => {
  let mailService: MailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: MAIL_TRANSPORTER,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: MAIL_MODULE_OPTIONS_TOKEN,
          useValue: {},
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
});
