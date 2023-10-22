import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';

import type { ApplicationConfiguration } from './application.config';
import { ApplicationModule } from './application.module';

async function bootstrap() {
  const application = await NestFactory.create(ApplicationModule);

  const configService = application.get(ConfigService);

  // @todo: Enable CORS.
  // @todo: Setup helm.

  useContainer(application.select(ApplicationModule), {
    fallbackOnErrors: true,
  });

  const port =
    configService.getOrThrow<ApplicationConfiguration['port']>(
      'application.port',
    );

  await application.listen(port);
}

bootstrap();
