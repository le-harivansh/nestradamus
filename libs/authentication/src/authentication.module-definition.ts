import { ConfigurableModuleBuilder } from '@nestjs/common';

import { AuthenticationModuleOptions } from './authentication.module-options';

export const {
  ConfigurableModuleClass: AuthenticationConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<AuthenticationModuleOptions>({
  moduleName: 'Authentication',
})
  .setClassMethodName('forRoot')
  .build();
