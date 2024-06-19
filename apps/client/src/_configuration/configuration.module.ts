import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { env } from 'node:process';

import { ConfigurationService } from './service/configuration.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
      envFilePath: [
        '.env',
        `./apps/client/${env['NODE_ENV'] === 'test' ? '.env.test' : '.env'}`,
      ],

      ignoreEnvFile: env['NODE_ENV'] === 'production',
      cache: env['NODE_ENV'] === 'production',
    }),
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
