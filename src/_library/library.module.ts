import { Module } from '@nestjs/common';

import { OtpModule } from './_otp/otp.module';
import { IsUniqueValidatorConstraint } from './validator/is-unique.validator';

@Module({
  providers: [IsUniqueValidatorConstraint],
  imports: [OtpModule],
})
export class LibraryModule {}
