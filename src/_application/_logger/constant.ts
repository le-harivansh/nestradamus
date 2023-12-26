export const LOG_LEVELS = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  verbose: 5,
};

export const LOG_COLORS: Record<keyof typeof LOG_LEVELS, string> = {
  fatal: 'bold redBG',
  error: 'bold red',
  warn: 'italic yellow',
  info: 'green',
  debug: 'cyan',
  verbose: 'gray',
};

/**
 * This symbol is used as the DI key for the configured `winston.Logger` that
 * is used in `WinstonLoggerService`.
 */
export const WINSTON_LOGGER = Symbol('winston-logger');
