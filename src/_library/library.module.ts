import { Module } from '@nestjs/common';

import { OtpModule } from './_otp/otp.module';
import { ExistenceValidatorConstraint } from './validator/constraint/existence.constraint';

@Module({
  providers: [ExistenceValidatorConstraint],
  imports: [OtpModule],
})
export class LibraryModule {}
