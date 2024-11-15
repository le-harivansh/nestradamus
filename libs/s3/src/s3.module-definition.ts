import { ConfigurableModuleBuilder } from '@nestjs/common';

import { S3ModuleOptions } from './s3.module-options';

export const {
  ConfigurableModuleClass: S3ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: S3_MODULE_OPTIONS_TOKEN,
  ASYNC_OPTIONS_TYPE: S3_MODULE_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<S3ModuleOptions>({
  moduleName: 'S3',
})
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: false }, (definition, { isGlobal }) => ({
    ...definition,
    global: isGlobal,
  }))
  .build();
