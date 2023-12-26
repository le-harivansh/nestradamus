/**
 * The name of the Bull queue for processing mails.
 */
export const MAIL_QUEUE = 'mail';

/**
 * Names of the jobs that can be added to the mailing queue.
 */
export const enum MailJob {
  SEND_MAIL = `${MAIL_QUEUE}:send`,
}

/**
 * The DI key of the provider for the mail transporter being used in the
 * application.
 *
 * This is currently referring to a configured `nodemailer` instance.
 */
export const TRANSPORTER = Symbol('mail-transporter');
