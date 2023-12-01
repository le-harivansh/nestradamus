import { Transporter, createTransport } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { ConfigurationService } from '../../_configuration/service/configuration.service';

export function transporterFactory(
  configurationService: ConfigurationService,
): Transporter<SMTPTransport.SentMessageInfo> {
  return createTransport(
    {
      host: configurationService.getOrThrow('mail.host'),
      port: configurationService.getOrThrow('mail.port'),
    },
    {
      from: {
        name: `The ${configurationService.getOrThrow('application.name')} Team`,
        address: configurationService.getOrThrow('mail.default.from'),
      },
    },
  );
}
