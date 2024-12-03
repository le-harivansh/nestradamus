import { ConfigurableModuleBuilder } from '@nestjs/common';

import { AuthenticationModuleOptions } from './authentication.module-options';

export const {
  MODULE_OPTIONS_TOKEN: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
  ConfigurableModuleClass: AuthenticationConfigurableModuleClass,
} = new ConfigurableModuleBuilder<AuthenticationModuleOptions>({
  moduleName: 'Authentication',
})
  .setClassMethodName('forRoot')
  .build();
