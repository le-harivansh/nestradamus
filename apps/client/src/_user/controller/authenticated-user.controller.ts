import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ObjectId, WithId } from 'mongodb';

import { RequiresPasswordConfirmation } from '@library/password-confirmation';

import { AuthenticatedUser } from '../../_authentication/decorator/authenticated-user.decorator';
import { RequiresPermission } from '../../_authorization/decorator/requires-permission.decorator';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entity/user.entity';
import { SerializedUser } from '../entity/user.serialized-entity';
import { UserService } from '../service/user.service';

@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthenticatedUserController {
  constructor(private readonly userService: UserService) {}

  @ApiCookieAuth()
  @ApiOperation({ summary: "Show the authenticated user's data." })
  @ApiOkResponse({
    example: new SerializedUser({
      _id: new ObjectId(),
      firstName: 'FirstName',
      lastName: 'LastName',
      email: 'user@email.dev',
      permissions: ['user:read:own'],
    } as WithId<User>),
  })
  @ApiUnauthorizedResponse({
    description: 'An authenticated user is needed to access this route.',
  })
  @ApiForbiddenResponse({
    description:
      "The authenticated user needs to have the 'user:read:own' permission.",
  })
  @Get()
  @RequiresPermission('user:read:own')
  show(@AuthenticatedUser() authenticatedUser: WithId<User>) {
    return new SerializedUser(authenticatedUser);
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update the authenticated user.' })
  @ApiOkResponse({
    example: new SerializedUser({
      _id: new ObjectId(),
      firstName: 'UpdatedFirstName',
      lastName: 'UpdatedLastName',
      email: 'updated-user@email.dev',
      permissions: ['user:update:own'],
    } as WithId<User>),
  })
  @ApiUnauthorizedResponse({
    description: 'An authenticated user is needed to access this route.',
  })
  @ApiForbiddenResponse({
    description:
      "The authenticated user needs to have the 'user:update:own' permission.",
  })
  @ApiBadRequestResponse({
    description: 'Invalid data was provided to update the user.',
  })
  @Patch()
  @UseGuards(RequiresPasswordConfirmation)
  @RequiresPermission('user:update:own')
  async update(
    @AuthenticatedUser() { _id: userId }: WithId<User>,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.update(userId, updateUserDto);

    return new SerializedUser(updatedUser);
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete the authenticated user.' })
  @ApiNoContentResponse({ description: 'The authenticated user was deleted.' })
  @ApiUnauthorizedResponse({
    description: 'An authenticated user is needed to access this route.',
  })
  @ApiForbiddenResponse({
    description:
      "The authenticated user needs to have the 'user:delete:own' permission.",
  })
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RequiresPasswordConfirmation)
  @RequiresPermission('user:delete:own')
  async delete(@AuthenticatedUser() { _id: userId }: WithId<User>) {
    await this.userService.delete(userId);
  }
}
