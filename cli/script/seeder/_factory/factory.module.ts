import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdministratorFactory } from '@/_administration/_administrator/factory/administrator.factory';
import {
  Administrator,
  AdministratorSchema,
} from '@/_administration/_administrator/schema/administrator.schema';
import { UserFactory } from '@/_user/_user/factory/user.factory';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';

@Module({
  imports: [
    /**
     * The mongoose schemas for the factories should be registered here.
     */
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Administrator.name, schema: AdministratorSchema },
    ]),
  ],

  /**
   * While model factories are registered here, they live in their own modules.
   */
  providers: [UserFactory, AdministratorFactory],

  /**
   * All model factories should be exported to be accessible in the seeder.
   */
  exports: [UserFactory, AdministratorFactory],
})
export class FactoryModule {}
