import { Global, Module } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';

import { ConfigurationService } from '../_configuration/service/configuration.service';
import { LOG_COLORS, LOG_LEVELS } from './constant';
import { WinstonLoggerService } from './service/winston-logger.service';

@Global()
@Module({
  providers: [
    {
      provide: WinstonLoggerService,
      inject: [ConfigurationService],
      useFactory: (configurationService: ConfigurationService) => {
        const applicationName =
          configurationService.getOrThrow('application.name');

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
            format((info) => {
              info.level = info.level.toUpperCase();

              return info;
            })(),
          ),
          transports: [
            // @todo: add winston transport(s)
          ],
        });

        const applicationEnvironment = configurationService.getOrThrow(
          'application.environment',
        );

        if (applicationEnvironment === 'development') {
          winstonLogger.add(
            new transports.Console({
              level: 'verbose',
              handleExceptions: true,
              format: format.combine(
                format.colorize({
                  all: true,
                  colors: LOG_COLORS,
                }),
                format.printf(
                  ({
                    level,
                    message,
                    metadata: { application, context, ms, timestamp },
                  }) =>
                    `${level} [${application}] ${timestamp} - [${context}] ${message} (${ms})`,
                ),
              ),
            }),
          );
        }

        return new WinstonLoggerService(winstonLogger);
      },
    },
  ],
  exports: [WinstonLoggerService],
})
export class LoggerModule {}
