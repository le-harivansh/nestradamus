import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { MailModule, MailService } from '@application/mail';

import { MailModuleOptions } from '../src/mail.module-options';
import { MailPit } from './helper/mailpit';

describe('Mail sending (e2e)', () => {
  const mailModuleConfigurationOptions: MailModuleOptions = {
    host: 'localhost',
    port: 1025,
    authentication: {
      username: 'nestradamus',
      password: 'nestradamus',
    },
    default: {
      from: {
        name: 'Nestradamus Team',
        address: 'test@nestradamus.dev',
      },
    },
  };
  const MAILPIT_API_PORT = 8025;

  let mailPitClient: MailPit;

  let application: INestApplication;
  let mailService: MailService;

  let startTime: Date;

  beforeAll(async () => {
    mailPitClient = new MailPit(
      `http://${mailModuleConfigurationOptions.host}:${MAILPIT_API_PORT}`,
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MailModule.forRoot(mailModuleConfigurationOptions)],
    }).compile();

    application = moduleFixture.createNestApplication();
    mailService = application.get(MailService);

    await application.init();

    startTime = new Date();
  });

  afterAll(async () => {
    const endTime = new Date();

    await mailPitClient.deleteMessagesBetween(startTime, endTime);
  });

  it('successfully sends an email to the proper recipient', async () => {
    const mailOptions = {
      to: 'recipient@email.dev',
      subject: 'Email subject',
      mjml: {
        template: `
          <mjml>
            <mj-body>
              <mj-section background-color="#f0f0f0">
                <mj-column>
                  <mj-text align="center" font-style="italic" font-size="20px" color="#626262">{{ __applicationName }}</mj-text>
                </mj-column>
              </mj-section>

              <mj-section>
                <mj-column>
                  <mj-text>
                    Hello {{ name }}!
                  </mj-text>
                </mj-column>
              </mj-section>

              <mj-section background-color="#f0f0f0">
                <mj-column>
                  <mj-text align="center" font-size="10px" color="#94a3b8">&copy; {{ __applicationName }} {{ __copyrightYear }}</mj-text>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>`,
        variables: {
          __applicationName: 'Nestradamus',
          __copyrightYear: new Date().getFullYear(),
          name: 'One Two',
        },
      },
    };

    await mailService
      .mail()
      .to(mailOptions.to)
      .subject(mailOptions.subject)
      .mjml(mailOptions.mjml.template, mailOptions.mjml.variables)
      .send();

    const emails = await mailPitClient.searchMessages(
      `subject:"${mailOptions.subject}"`,
    );

    expect(emails['messages']).toHaveLength(1);

    const email = await mailPitClient.getMessageById(emails['messages'][0]!.ID);

    const message = `Hello ${mailOptions.mjml.variables.name}!`;

    expect(email.HTML.includes(message)).toBe(true);
    expect(email.Text.includes(message)).toBe(true);
  });
});
