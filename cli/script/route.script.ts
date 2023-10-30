/**
 * This script is used to pretty-print the application routes.
 *
 * Currently, it creates the whole application before parsing the routes.
 * Note that the application's outside dependencies - such as the database -
 * need to be available to be able to start the script.
 *
 * // @todo Find a way to mock out the non-essential modules to be able to start
 * the script without them.
 *
 * // @todo Find a way to parse and get the application routes without
 * scaffolding the entire application.
 */
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import expressListRoutes from 'express-list-routes';

import { ApplicationModule } from '../../src/application.module';

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
