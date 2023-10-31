import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../../../_user/schema/user.schema';
import { UserFactory } from './factory/user.factory';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UserFactory],
  exports: [UserFactory],
})
export class FactoryModule {}
