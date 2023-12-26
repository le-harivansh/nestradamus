import { Module } from '@nestjs/common';

import { AdministratorModule } from './_administrator/administrator.module';
import { AuthenticationModule } from './_authentication/authentication.module';

@Module({
  imports: [AdministratorModule, AuthenticationModule],
})
export class AdministrationSection {}
