import { ConfigurableModuleBuilder } from '@nestjs/common';

import { MailModuleOptions } from './mail.module-options';

export const {
  MODULE_OPTIONS_TOKEN: MAIL_MODULE_OPTIONS_TOKEN,
  ConfigurableModuleClass: MailConfigurableModuleClass,
} = new ConfigurableModuleBuilder<MailModuleOptions>({
  moduleName: 'Mail',
})
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: false }, (definition, { isGlobal }) => ({
    ...definition,
    global: isGlobal,
  }))
  .build();
