import { repl } from '@nestjs/core';

import { ApplicationModule } from './application.module';

(async () => {
  const replServer = await repl(ApplicationModule);

  replServer.setupHistory('./apps/client/.repl.history', (error) => {
    if (error) {
      console.error(error);
    }
  });
})();
