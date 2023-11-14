import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import helmet from 'helmet';

import { ConfigurationService } from './_application/_configuration/service/configuration.service';
import { WinstonLoggerService } from './_application/_logger/service/winston-logger.service';
import { MainModule } from './main.module';

(async () => {
  const application = await NestFactory.create<NestExpressApplication>(
    MainModule,
    { bufferLogs: true },
  );
  application.useLogger(await application.resolve(WinstonLoggerService));

  application.enableCors();
  application.use(helmet());

  application.enableShutdownHooks();

  useContainer(application.select(MainModule), {
    fallbackOnErrors: true,
  });

  const configurationService = application.get(ConfigurationService);

  const port = configurationService.getOrThrow('application.port');

  await application.listen(port);
})();
