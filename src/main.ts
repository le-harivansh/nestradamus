import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';

import type { ApplicationConfiguration } from './application.config';
import { ApplicationModule } from './application.module';

(async () => {
  const application =
    await NestFactory.create<NestExpressApplication>(ApplicationModule);

  const configService = application.get(ConfigService);

  useContainer(application.select(ApplicationModule), {
    fallbackOnErrors: true,
  });

  const port =
    configService.getOrThrow<ApplicationConfiguration['port']>(
      'application.port',
    );

  await application.listen(port);
})();
