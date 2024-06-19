import { ConfigService } from '@nestjs/config';

export abstract class ConfigurationService<T extends Record<string, unknown>> {
  constructor(private readonly configService: ConfigService) {}

  getOrThrow<U extends keyof T>(key: U) {
    return this.configService.getOrThrow<T[U]>(key as string);
  }
}
