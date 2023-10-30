import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import helmet from 'helmet';

import type { ApplicationConfiguration } from './application.config';
import { ApplicationModule } from './application.module';

(async () => {
  const application =
    await NestFactory.create<NestExpressApplication>(ApplicationModule);

  application.enableCors();
  application.use(helmet());

  application.enableShutdownHooks();

  useContainer(application.select(ApplicationModule), {
    fallbackOnErrors: true,
  });

  const configService = application.get(ConfigService);

  const port =
    configService.getOrThrow<ApplicationConfiguration['port']>(
      'application.port',
    );

  await application.listen(port);
})();
