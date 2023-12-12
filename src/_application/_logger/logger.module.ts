import { Global, Module } from '@nestjs/common';

import { ConfigurationService } from '../_configuration/service/configuration.service';
import { WINSTON_LOGGER } from './constant';
import winstonLoggerFactory from './factory/winston-logger.factory';
import { WinstonLoggerService } from './service/winston-logger.service';

@Global()
@Module({
  providers: [
    {
      provide: WINSTON_LOGGER,
      inject: [ConfigurationService],
      useFactory: winstonLoggerFactory,
    },
    WinstonLoggerService,
  ],
  exports: [WinstonLoggerService],
})
export class LoggerModule {}
