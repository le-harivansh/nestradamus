import { INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';

import { MailService } from '@/_application/_mail/service/mail.service';

import { setupTestApplication, teardownTestApplication } from './bootstrap';
import { Mailhog } from './mailhog';
import { generateEmail } from './miscellaneous';

describe(`${Mailhog.name} (e2e)`, () => {
  const start = new Date();

  let application: INestApplication;
  let databaseConnection: Connection;

  let mailService: MailService;

  let mailhog: Mailhog;

  beforeAll(async () => {
    const {
      application: testApplication,
      databaseConnection: testDatabaseConnection,
    } = await setupTestApplication();

    application = testApplication;
    databaseConnection = testDatabaseConnection;

    mailService = application.get(MailService);

    mailhog = new Mailhog();
  });

  afterAll(async () => {
    await mailhog.deleteEmailsSentBetween(start, new Date());

    await teardownTestApplication({
      application,
      databaseConnection,
    });
  });

  describe('getLatestEmail', () => {
    it('retrieves the latest email sent - after the email-sending is awaited', async () => {
      const dataOfEmailsToSend = [generateEmail(), generateEmail()];

      const notBefore = new Date();

      await Promise.all(
        dataOfEmailsToSend.map(
          ({ mailOptions, html = undefined, text = undefined }) =>
            mailService.queueSend(mailOptions, html, text),
        ),
      );

      const latestEmail = await mailhog.getLatestEmail({
        contents: dataOfEmailsToSend[1]!.__.textContent,
        notBefore,
      });

      expect(latestEmail.text).toMatch(dataOfEmailsToSend[1]!.__.textContent);
      expect(latestEmail.deliveryDate.valueOf()).toBeGreaterThan(
        notBefore.valueOf(),
      );
    });

    it('retrieves the latest email sent - even if the email-sending is NOT awaited', async () => {
      const dataOfEmailsToSend = [generateEmail(), generateEmail()];

      const notBefore = new Date();

      dataOfEmailsToSend.forEach(
        ({ mailOptions, html = undefined, text = undefined }) =>
          mailService.queueSend(mailOptions, html, text),
      );

      const latestEmail = await mailhog.getLatestEmail({
        contents: dataOfEmailsToSend[1]!.__.textContent,
        notBefore,
      });

      expect(latestEmail.text).toMatch(dataOfEmailsToSend[1]!.__.textContent);
      expect(latestEmail.deliveryDate.valueOf()).toBeGreaterThan(
        notBefore.valueOf(),
      );
    });

    it('retrieves the latest email sent to the specified recipient', async () => {
      const dataOfEmailsToSend = [
        generateEmail(),
        generateEmail(),
        generateEmail(),
      ];

      const notBefore = new Date();

      await Promise.all(
        dataOfEmailsToSend.map(
          ({ mailOptions, html = undefined, text = undefined }) =>
            mailService.queueSend(mailOptions, html, text),
        ),
      );

      const latestEmail = await mailhog.getLatestEmail({
        contents: dataOfEmailsToSend[2]!.__.textContent,
        notBefore,
      });

      expect(latestEmail.text).toMatch(dataOfEmailsToSend[1]!.__.textContent);
      expect(latestEmail.to).toBe(dataOfEmailsToSend[2]!.mailOptions.to);
    });
  });
});
