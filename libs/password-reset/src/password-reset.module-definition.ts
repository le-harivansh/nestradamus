import { ConfigurableModuleBuilder } from '@nestjs/common';

import { PasswordResetModuleOptions } from './password-reset.module-options';

export const {
  MODULE_OPTIONS_TOKEN: PASSWORD_RESET_MODULE_OPTIONS_TOKEN,
  ConfigurableModuleClass: PasswordResetConfigurableModuleClass,
} = new ConfigurableModuleBuilder<PasswordResetModuleOptions>({
  moduleName: 'PasswordReset',
})
  .setClassMethodName('forRoot')
  .build();
