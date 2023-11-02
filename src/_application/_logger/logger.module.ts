import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createLogger, format, transports } from 'winston';

import { ApplicationConfiguration } from '../application.config';
import { LOG_COLORS, LOG_LEVELS } from './helper';
import { WinstonLoggerService } from './service/winston-logger.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: WinstonLoggerService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const applicationName =
          configService.getOrThrow<ApplicationConfiguration['name']>(
            'application.name',
          );

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

        const applicationEnvironment = configService.get<
          ApplicationConfiguration['environment']
        >('application.environment');

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
