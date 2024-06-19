import { NestFactory } from '@nestjs/core';

import { AdministrationModule } from './administration.module';

(async () => {
  const PORT = 3001;

  const app = await NestFactory.create(AdministrationModule);

  await app.listen(PORT);
})();
