import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { Logger } from 'winston';

import { LOG_LEVELS } from '../helper';

@Injectable({ scope: Scope.TRANSIENT })
export class WinstonLoggerService implements LoggerService {
  private context?: string;

  constructor(private readonly logger: Logger) {}

  fatal(message: string, ...optionalParams: unknown[]) {
    this.logMessage('fatal', message, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]) {
    this.logMessage('error', message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]) {
    this.logMessage('warn', message, ...optionalParams);
  }

  log(message: string, ...optionalParams: unknown[]) {
    this.logMessage('info', message, ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]) {
    this.logMessage('debug', message, ...optionalParams);
  }

  verbose(message: string, ...optionalParams: unknown[]) {
    this.logMessage('verbose', message, ...optionalParams);
  }

  setContext(context?: string) {
    this.context = context;
  }

  private logMessage(
    level: keyof typeof LOG_LEVELS,
    message: string,
    ...optionalParams: unknown[]
  ) {
    const metadata = {
      context:
        this.context ??
        (optionalParams.length === 1 && typeof optionalParams[0] === 'string'
          ? optionalParams[0]
          : 'Application'),
      optionalParams,
    };

    this.logger.log(level, message, metadata);
  }
}
