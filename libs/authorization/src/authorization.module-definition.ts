import { ConfigurableModuleBuilder } from '@nestjs/common';

import { AuthorizationModuleOptions } from './authorization.module-options';

export const {
  MODULE_OPTIONS_TOKEN: AUTHORIZATION_MODULE_OPTIONS_TOKEN,
  ConfigurableModuleClass: AuthorizationConfigurableModuleClass,
} = new ConfigurableModuleBuilder<AuthorizationModuleOptions>({
  moduleName: 'Authorization',
})
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: false }, (definition, { isGlobal }) => ({
    ...definition,
    global: isGlobal,
  }))
  .build();
