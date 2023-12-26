import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TokenModule } from '../_authentication/_token/token.module';
import { AdministratorController } from './controller/administrator.controller';
import {
  Administrator,
  AdministratorSchema,
} from './schema/administrator.schema';
import { AdministratorService } from './service/administrator.service';

@Module({
  imports: [
    forwardRef(() => TokenModule),
    MongooseModule.forFeature([
      { name: Administrator.name, schema: AdministratorSchema },
    ]),
  ],
  controllers: [AdministratorController],
  providers: [AdministratorService],
  exports: [AdministratorService],
})
export class AdministratorModule {}
