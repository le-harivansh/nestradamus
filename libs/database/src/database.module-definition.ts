import { ConfigurableModuleBuilder } from '@nestjs/common';

import { DatabaseModuleOptions } from './database.module-options';

export const {
  MODULE_OPTIONS_TOKEN: DATABASE_MODULE_OPTIONS_TOKEN,
  ConfigurableModuleClass: DatabaseConfigurableModuleClass,
} = new ConfigurableModuleBuilder<DatabaseModuleOptions>({
  moduleName: 'Database',
})
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: false }, (definition, { isGlobal }) => ({
    ...definition,
    global: isGlobal,
  }))
  .build();
