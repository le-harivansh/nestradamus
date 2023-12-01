import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Otp, OtpSchema } from './schema/otp.schema';
import { OtpService } from './service/otp.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }])],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
