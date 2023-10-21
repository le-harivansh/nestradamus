import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { ConfigModule } from '@nestjs/config';
import applicationConfiguration from './application.config';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: process.env.NODE_ENV === 'production',
      expandVariables: true,
    }),
    ConfigModule.forFeature(applicationConfiguration),
    DatabaseModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
})
export class ApplicationModule {}
