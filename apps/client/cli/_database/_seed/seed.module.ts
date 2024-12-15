import { Module } from '@nestjs/common';

import { AUTHORIZATION_PERMISSIONS_CONTAINER } from '@library/authorization/constant';
import { PermissionContainer } from '@library/authorization/helper/permission-container';

import { PERMISSION_STRING_SEPARATOR } from '../../../src/_authorization/constant';
import { createPermissionsMap } from '../../../src/_authorization/permission-map';
import { UserRepository } from '../../../src/_user/repository/user.repository';
import { UserService } from '../../../src/_user/service/user.service';
import { SeedCommand } from './command/seed.command';
import { UserSeeder } from './seeder/user.seeder';

@Module({
  providers: [
    // User CRUD
    UserRepository,
    UserService,
    {
      provide: AUTHORIZATION_PERMISSIONS_CONTAINER,
      useValue: new PermissionContainer(
        createPermissionsMap(),
        PERMISSION_STRING_SEPARATOR,
      ),
    },

    UserSeeder,

    SeedCommand,
  ],
})
export class SeedModule {}
