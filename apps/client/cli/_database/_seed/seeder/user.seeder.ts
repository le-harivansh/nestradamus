import { Inject, Injectable } from '@nestjs/common';

import { AUTHORIZATION_PERMISSIONS_CONTAINER } from '@library/authorization/constant';
import { PermissionContainer } from '@library/authorization/helper/permission-container';

import { UserService } from '../../../../src/_user/service/user.service';

@Injectable()
export class UserSeeder {
  constructor(
    private readonly userService: UserService,
    @Inject(AUTHORIZATION_PERMISSIONS_CONTAINER)
    private readonly permissionsContainer: PermissionContainer,
  ) {}

  async run(): Promise<void> {
    await this.userService.create({
      firstName: 'FirstName',
      lastName: 'LastName',
      email: 'user@email.dev',
      password: 'P@ssw0rd',
      permissions: this.permissionsContainer.getPermissions(),
    });
  }
}
