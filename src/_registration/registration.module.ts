import { Module } from '@nestjs/common';

import { UserModule } from '../_user/user.module';
import { RegistrationController } from './registration.controller';

@Module({
  imports: [UserModule],
  controllers: [RegistrationController],
})
export class RegistrationModule {}
