import { CommandFactory } from 'nest-commander';

import { CliModule } from './cli.module';

(async () => {
  await CommandFactory.run(CliModule, ['error', 'fatal']);
})();
