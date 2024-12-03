import { JSDOM } from 'jsdom';
import { ObjectId } from 'mongodb';

import { MailPit } from '@library/mail/../test/helper/mailpit';

import { ConfigurationService } from '../../src/_configuration/service/configuration.service';

export async function getPasswordResetId(
  mailPitClient: MailPit,
  configurationService: ConfigurationService,
) {
  const emailSnippet = (
    await mailPitClient.searchMessages(
      `before:"" after:"" subject:"Forgot your ${configurationService.getOrThrow('application.name')} password"`,
    )
  ).messages[0];

  if (emailSnippet === undefined) {
    throw new Error('Could not find the forgot-password email');
  }

  const email = await mailPitClient.getMessageById(emailSnippet.ID);
  const emailJsdom = new JSDOM(email.HTML);
  const passwordResetLink = emailJsdom.window.document.querySelector(
    '[data-test-id="password-reset-link"]',
  )?.textContent;

  if (!passwordResetLink) {
    throw new Error(
      'Could not retrieve the password-reset link from the forgot-password email',
    );
  }

  const passwordResetId = passwordResetLink.split('/').reverse()[0];

  if (!passwordResetId) {
    throw new Error(
      'The password-reset id could not be retrieved from the password-reset link',
    );
  }

  return new ObjectId(passwordResetId);
}
