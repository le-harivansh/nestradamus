import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

import { ConfigurationService } from './_configuration/service/configuration.service';
import { ApplicationModule } from './application.module';

(async () => {
  const application = (
    await NestFactory.create<NestExpressApplication>(ApplicationModule)
  ).enableShutdownHooks();

  const configurationService = application.get(ConfigurationService);

  // Cookie-parsing
  const cookieSecret = configurationService.getOrThrow('application.secret');
  application.use(cookieParser(cookieSecret));

  // Port
  const port = configurationService.getOrThrow('application.port');
  await application.listen(port);
})();
