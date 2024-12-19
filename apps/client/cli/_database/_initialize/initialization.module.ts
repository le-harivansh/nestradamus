import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PasswordResetSchema } from '../../../src/_password-reset/entity/password-reset.schema';
import passwordResetConfiguration from '../../../src/_password-reset/password-reset.config';
import { UserSchema } from '../../../src/_user/entity/user.schema';
import { InitializationCommand } from './command/initialization.command';

@Module({
  imports: [ConfigModule.forFeature(passwordResetConfiguration)],
  providers: [InitializationCommand, UserSchema, PasswordResetSchema],
})
export class InitializationModule {}
