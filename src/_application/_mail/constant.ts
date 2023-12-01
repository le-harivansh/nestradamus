export const MAIL_QUEUE = 'mail-queue';

export const enum MailQueue {
  SEND_MAIL = 'mail:send',
}

export const TRANSPORTER = Symbol('mail-transporter');
