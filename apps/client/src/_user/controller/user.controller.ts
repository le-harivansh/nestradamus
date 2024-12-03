import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { WithId } from 'mongodb';

import { RequiresPasswordConfirmation } from '@library/password-confirmation';

import { AuthenticatedUser } from '../../_authentication/decorator/authenticated-user.decorator';
import { RequiresPermission } from '../../_authorization/decorator/requires-permission.decorator';
import { UpdateGeneralUserDataDto } from '../dto/update-general-user-data.dto';
import { UpdateUserEmailDto } from '../dto/update-user-email.dto';
import { UpdateUserPasswordDto } from '../dto/update-user-password.dto';
import { User } from '../schema/user.schema';
import { UserService } from '../service/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RequiresPermission('user:read:own')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  show(@AuthenticatedUser() { password: _, ...userData }: WithId<User>) {
    return userData;
  }

  @Patch()
  @RequiresPermission('user:update:own')
  async updateGeneralData(
    @AuthenticatedUser() { _id: userId }: WithId<User>,
    @Body() updateGeneralUserDataDto: UpdateGeneralUserDataDto,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...updatedUserData } = await this.userService.update(
      userId,
      updateGeneralUserDataDto,
    );

    return updatedUserData;
  }

  @Patch('email')
  @UseGuards(RequiresPasswordConfirmation)
  @RequiresPermission('user:update:own')
  async updateEmail(
    @AuthenticatedUser() { _id: userId }: WithId<User>,
    @Body() { email }: UpdateUserEmailDto,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...updatedUserData } = await this.userService.update(
      userId,
      { email },
    );

    return updatedUserData;
  }

  @Patch('password')
  @UseGuards(RequiresPasswordConfirmation)
  @RequiresPermission('user:update:own')
  async updatePassword(
    @AuthenticatedUser() { _id: userId }: WithId<User>,
    @Body() { password }: UpdateUserPasswordDto,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...updatedUserData } = await this.userService.update(
      userId,
      { password },
    );

    return updatedUserData;
  }

  /**
   * Note: Permissions are not GENERALLY meant to be updated by the User, but
   * rather by an Administrator (if such an entity exists) within the
   * application.
   */

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RequiresPasswordConfirmation)
  @RequiresPermission('user:delete:own')
  delete(@AuthenticatedUser() { _id: userId }: WithId<User>) {
    return this.userService.delete(userId);
  }
}
