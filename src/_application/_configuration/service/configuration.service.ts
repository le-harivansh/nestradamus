import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { NamespacedConfiguration } from '../type';

@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {}

  getOrThrow<T extends keyof NamespacedConfiguration>(key: T) {
    return this.configService.getOrThrow<NamespacedConfiguration[T]>(key);
  }
}
