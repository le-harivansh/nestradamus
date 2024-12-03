import { ConfigurableModuleBuilder } from '@nestjs/common';

import { PasswordConfirmationModuleOptions } from './password-confirmation.module-options';

export const {
  MODULE_OPTIONS_TOKEN: PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN,
  ConfigurableModuleClass: PasswordConfirmationConfigurableModuleClass,
} = new ConfigurableModuleBuilder<PasswordConfirmationModuleOptions>({
  moduleName: 'PasswordConfirmation',
})
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: false }, (definition, { isGlobal }) => ({
    ...definition,
    global: isGlobal,
  }))
  .build();
