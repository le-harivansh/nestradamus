import { ConfigurableModuleBuilder } from '@nestjs/common';

import { S3ModuleOptions } from './s3.module-options';

export const {
  MODULE_OPTIONS_TOKEN: S3_MODULE_OPTIONS_TOKEN,
  ConfigurableModuleClass: S3ConfigurableModuleClass,
} = new ConfigurableModuleBuilder<S3ModuleOptions>({
  moduleName: 'S3',
})
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: false }, (definition, { isGlobal }) => ({
    ...definition,
    global: isGlobal,
  }))
  .build();
