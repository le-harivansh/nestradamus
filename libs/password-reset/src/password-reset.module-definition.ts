import { ConfigurableModuleBuilder } from '@nestjs/common';

import { PasswordResetModuleOptions } from './password-reset.module-options';

export const {
  ConfigurableModuleClass: PasswordResetConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: PASSWORD_RESET_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<PasswordResetModuleOptions>({
  moduleName: 'PasswordReset',
})
  .setClassMethodName('forRoot')
  .build();
