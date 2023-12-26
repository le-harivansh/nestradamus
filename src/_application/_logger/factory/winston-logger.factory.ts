import { Logger, createLogger, format, transports } from 'winston';

import { ConfigurationService } from '@/_application/_configuration/service/configuration.service';

import { LOG_COLORS, LOG_LEVELS } from '../constant';
import contextFormatter from '../formatter/context.formatter';
import levelFormatter from '../formatter/level.formatter';
import messageFormatter from '../formatter/message.formatter';
import optionalParamsFormatter from '../formatter/optional-params.formatter';

export default function winstonLoggerFactory(
  configurationService: ConfigurationService,
): Logger {
  const applicationName = configurationService.getOrThrow('application.name');

  const winstonLogger = createLogger({
    levels: LOG_LEVELS,
    defaultMeta: {
      application: applicationName,
    },
    exitOnError: false,
    format: format.combine(
      format.timestamp({
        format: 'DD-MM-YYYY @ HH:mm:ss',
      }),
      format.ms(),
      format.errors({ stack: true }),
      format.metadata(),
      contextFormatter(),
      levelFormatter(),
      optionalParamsFormatter(),
    ),
  });

  const applicationEnvironment = configurationService.getOrThrow(
    'application.environment',
  );

  switch (applicationEnvironment) {
    case 'test':
      winstonLogger.add(
        new transports.Console({
          silent: true,
        }),
      );
      break;

    case 'development':
      winstonLogger.add(
        new transports.Console({
          level: 'verbose',
          handleExceptions: true,
          format: format.combine(
            format.colorize({
              all: true,
              colors: LOG_COLORS,
            }),
            messageFormatter(),
          ),
        }),
      );
      break;

    case 'production':
      // @todo: add winston transport(s) for production.
      break;
  }

  return winstonLogger;
}
