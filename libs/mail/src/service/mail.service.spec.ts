import { Test, TestingModule } from '@nestjs/testing';

import { MAIL_TRANSPORTER } from '../constant';
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
