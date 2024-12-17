import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { ConfigurationService } from './_configuration/service/configuration.service';
import { ApplicationModule } from './application.module';

(async () => {
  const application =
    await NestFactory.create<NestExpressApplication>(ApplicationModule);

  // Enable shutdown hooks
  application.enableShutdownHooks();

  // Setup Helmet (should be the 1st middleware registered) [see https://docs.nestjs.com/security/helmet]
  application.use(helmet());

  const configurationService = application.get(ConfigurationService);

  // Enable CORS
  application.enableCors({
    origin: configurationService.getOrThrow('application.frontendUrl'),
    credentials: true,
  });

  // Setup cookie-parsing
  const cookieSecret = configurationService.getOrThrow('application.secret');
  application.use(cookieParser(cookieSecret));

  // Setup container for custom class-validators
  useContainer(application.select(ApplicationModule), {
    fallbackOnErrors: true,
  });

  // Setup Swagger (only in development)
  if (
    configurationService.getOrThrow('application.environment') === 'development'
  ) {
    const SWAGGER_PATH = '_api';
    const applicationName = configurationService.getOrThrow('application.name');

    const swaggerDocumentBuilder = new DocumentBuilder()
      .setTitle(`${applicationName} API`)
      .setDescription(
        `The API definitions of the ${applicationName} application.`,
      )
      .setVersion('1.0')
      .build();

    SwaggerModule.setup(SWAGGER_PATH, application, () =>
      SwaggerModule.createDocument(application, swaggerDocumentBuilder),
    );
  }

  // Start listening for requests
  await application.listen(configurationService.getOrThrow('application.port'));
})();
