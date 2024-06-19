import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigurationService as BaseConfigurationService } from '@application/configuration';

import { NamespacedConfiguration } from '../type';

@Injectable()
export class ConfigurationService extends BaseConfigurationService<NamespacedConfiguration> {
  constructor(configService: ConfigService) {
    super(configService);
  }
}
