import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConfigurationService } from './service/configuration.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      cache: process.env.NODE_ENV === 'production',
    }),
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
