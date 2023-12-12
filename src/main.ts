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

  /**
   * The shutdown hooks are enabled because of healthchecks through terminus.
   *
   * @see: https://docs.nestjs.com/recipes/terminus#setting-up-a-healthcheck
   */
  application.enableShutdownHooks();

  /**
   * This is needed because we want to inject nest dependencies in custom
   * validator constraints.
   */
  useContainer(application.select(MainModule), {
    fallbackOnErrors: true,
  });

  const configurationService = application.get(ConfigurationService);

  const port = configurationService.getOrThrow('application.port');

  await application.listen(port);
})();
