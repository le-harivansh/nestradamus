import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'winston';

import { LOG_LEVELS } from '../helper';
import { WinstonLoggerService } from './winston-logger.service';

describe(WinstonLoggerService.name, () => {
  const winstonLogger = {
    log: jest.fn(),
  };

  let winstonLoggerService: WinstonLoggerService;
  let logMessageSpy: jest.SpyInstance;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: Logger,
          useValue: winstonLogger,
        },
        WinstonLoggerService,
      ],
    }).compile();

    winstonLoggerService = await module.resolve(WinstonLoggerService);
    logMessageSpy = jest.spyOn(winstonLoggerService as any, 'logMessage');
  });

  afterEach(() => {
    jest.clearAllMocks();

    winstonLoggerService.setContext(undefined);
  });

  it('should be defined', () => {
    expect(winstonLoggerService).toBeDefined();
  });

  describe('logMessage', () => {
    it("calls the logger's `log` method with the proper level & message", () => {
      const level: keyof typeof LOG_LEVELS = 'info';
      const message = 'hello, world!';

      winstonLoggerService['logMessage'](level, message);

      expect(winstonLogger.log).toHaveBeenCalledTimes(1);
      expect(winstonLogger.log.mock.calls[0][0]).toBe(level);
      expect(winstonLogger.log.mock.calls[0][1]).toBe(message);
    });

    it("calls the logger's `log` method with the proper `metadata`", () => {
      const optionalParams = ['one', 2, { three: true }];

      winstonLoggerService['logMessage']('debug', 'message', ...optionalParams);

      expect(winstonLogger.log.mock.calls[0][2]).toStrictEqual({
        context: 'Application',
        optionalParams,
      });
    });

    it("calls the logger's `log` method with the predefined `context` in the `metadata`", () => {
      const context = 'WinstonLoggerServiceTest';

      winstonLoggerService.setContext(context);

      winstonLoggerService['logMessage']('debug', 'message');

      expect(winstonLogger.log.mock.calls[0][2].context).toBe(context);
    });

    it("calls the logger's `log` method with the first item of the `optionalParams` as the `context` in the `metadata` - if the `optionalParams` contains only a single string", () => {
      const context = 'AnotherContext';

      winstonLoggerService['logMessage']('verbose', 'message', context);

      expect(winstonLogger.log.mock.calls[0][2].context).toBe(context);
    });
  });

  describe.each<{
    method: keyof WinstonLoggerService;
    level: keyof typeof LOG_LEVELS;
    message: string;
    optionalParams: unknown[];
  }>([
    {
      method: 'fatal',
      level: 'fatal',
      message: 'hello, fatal!',
      optionalParams: ['one', 2, { three: true }],
    },
    {
      method: 'error',
      level: 'error',
      message: 'hello, error!',
      optionalParams: ['four', 5, { six: false }],
    },
    {
      method: 'warn',
      level: 'warn',
      message: 'hello, warn!',
      optionalParams: ['seven', 8, { nine: true }],
    },
    {
      method: 'log',
      level: 'info',
      message: 'hello, info!',
      optionalParams: ['ten', 11, { twelve: false }],
    },
    {
      method: 'debug',
      level: 'debug',
      message: 'hello, debug!',
      optionalParams: ['thirteen', 14, { fifteen: true }],
    },
    {
      method: 'verbose',
      level: 'verbose',
      message: 'hello, verbose!',
      optionalParams: ['sixteen', 17, { eighteen: false }],
    },
  ])(`$method`, ({ method, level, message, optionalParams }) => {
    it("calls the logger's `log` method with the appropriate arguments", () => {
      winstonLoggerService[method](message, ...optionalParams);

      expect(logMessageSpy).toHaveBeenCalledTimes(1);
      expect(logMessageSpy).toHaveBeenCalledWith(
        level,
        message,
        ...optionalParams,
      );
    });
  });
});
