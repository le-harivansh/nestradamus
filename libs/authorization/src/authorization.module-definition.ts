import { ConfigurableModuleBuilder } from '@nestjs/common';

import { AuthorizationModuleOptions } from './authorization.module-options';

export const {
  ConfigurableModuleClass: AuthorizationConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: AUTHORIZATION_MODULE_OPTIONS_TOKEN,
  ASYNC_OPTIONS_TYPE: AUTHORIZATION_MODULE_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<AuthorizationModuleOptions>({
  moduleName: 'Authorization',
})
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: false }, (definition, { isGlobal }) => ({
    ...definition,
    global: isGlobal,
  }))
  .build();
