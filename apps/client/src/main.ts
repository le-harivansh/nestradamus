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

  // Enable CORS.
  application.enableCors({
    origin: configurationService.getOrThrow('application.frontendUrl'),
    credentials: true,
  });

  // Setup cookie-parsing
  const cookieSecret = configurationService.getOrThrow('application.secret');
  application.use(cookieParser(cookieSecret));

  // Start listening for requests
  await application.listen(configurationService.getOrThrow('application.port'));
})();
