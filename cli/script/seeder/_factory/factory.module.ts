import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserFactory } from '@/_user/_user/factory/user.factory';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';

@Module({
  imports: [
    /**
     * The mongoose schemas for the factories should be registered here.
     */
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],

  /**
   * While model factories are registered here, they live in their own modules.
   */
  providers: [UserFactory],

  /**
   * All model factories should be exported to be accessible in the seeder.
   */
  exports: [UserFactory],
})
export class FactoryModule {}
