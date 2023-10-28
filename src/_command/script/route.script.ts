import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

/**
 * This package is currently installed in the application's `devDependencies`.
 * If at some point it is needed in a production environment, migrate the
 * package to the application's `dependencies` section in the  `package.json`
 * file.
 */
import expressListRoutes from 'express-list-routes';

import { ApplicationModule } from '../../application.module';

(async () => {
  const application = await NestFactory.create<NestExpressApplication>(
    ApplicationModule,
    {
      logger: false,
    },
  );

  const PORT = 65_000;

  await application.listen(PORT);

  expressListRoutes(
    (application.getHttpServer() as any)._events.request._router,
  );

  await application.close();
})();
