import { ConfigurableModuleBuilder } from '@nestjs/common';

import { DatabaseModuleOptions } from './database.module-options';

export const {
  ConfigurableModuleClass: DatabaseConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: DATABASE_MODULE_OPTIONS_TOKEN,
  ASYNC_OPTIONS_TYPE: DATABASE_MODULE_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<DatabaseModuleOptions>({
  moduleName: 'Database',
})
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: false }, (definition, { isGlobal }) => ({
    ...definition,
    global: isGlobal,
  }))
  .build();
