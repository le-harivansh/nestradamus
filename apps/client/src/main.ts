import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { ConfigurationService } from './_configuration/service/configuration.service';
import { ApplicationModule } from './application.module';

(async () => {
  const application =
    await NestFactory.create<NestExpressApplication>(ApplicationModule);

  // Enable shutdown hooks
  application.enableShutdownHooks();

  // Setup Helmet (should be the 1st middleware registered) [see https://docs.nestjs.com/security/helmet].
  application.use(helmet());

  const configurationService = application.get(ConfigurationService);

  // Cookie-parsing
  const cookieSecret = configurationService.getOrThrow('application.secret');
  application.use(cookieParser(cookieSecret));

  // Port
  const port = configurationService.getOrThrow('application.port');
  await application.listen(port);
})();
