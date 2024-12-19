import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ObjectId, WithId } from 'mongodb';

import { RequiresPermission } from '../../_authorization/decorator/requires-permission.decorator';
import { Entity } from '../../_database/pipe';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUserDto } from '../dto/list-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entity/user.entity';
import { SerializedUser } from '../entity/user.serialized-entity';
import { UserService } from '../service/user.service';

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiCookieAuth()
  @ApiOperation({ summary: 'List all the users.' })
  @ApiOkResponse({
    example: {
      total: 5,
      skip: 0,
      limit: 2,
      users: [
        new SerializedUser({
          _id: new ObjectId(),
          firstName: 'One',
          lastName: 'Two',
          email: 'one@two.dev',
          permissions: ['user:list'],
        } as WithId<User>),

        new SerializedUser({
          _id: new ObjectId(),
          firstName: 'Three',
          lastName: 'Four',
          email: 'three@four.dev',
          permissions: ['user:create'],
        } as WithId<User>),
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'An authenticated user is needed to access this route.',
  })
  @ApiForbiddenResponse({
    description:
      "The authenticated user needs to have the 'user:list' permission.",
  })
  @Get('users')
  @RequiresPermission('user:list')
  async list(@Query() { skip, limit }: ListUserDto) {
    const [users, total] = await Promise.all([
      this.userService.list(skip, limit),
      this.userService.count(),
    ]);

    return {
      total,
      skip,
      limit,
      users: users.map((user) => new SerializedUser(user)),
    };
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: "Show the specified user's data." })
  @ApiParam({
    name: 'id',
    required: true,
    description: "The 'id' of the user to retrieve.",
    example: new ObjectId(),
  })
  @ApiOkResponse({
    example: new SerializedUser({
      _id: new ObjectId(),
      firstName: 'FirstName',
      lastName: 'LastName',
      email: 'user@email.dev',
      permissions: ['user:list'],
    } as WithId<User>),
  })
  @ApiUnauthorizedResponse({
    description: 'An authenticated user is needed to access this route.',
  })
  @ApiForbiddenResponse({
    description:
      "The authenticated user needs to have the 'user:read:others' permission AND if the specified user to retrieve is the authenticated user, the authenticated user should have the 'user:read:own' permission.",
  })
  @ApiNotFoundResponse({
    description: 'The specified user could not be found.',
  })
  @Get('user/:id')
  @RequiresPermission(['user:read:others', { userId: 'id' }])
  show(@Param('id', Entity(User)) user: WithId<User>) {
    return new SerializedUser(user);
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a user.' })
  @ApiCreatedResponse({
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
      "The authenticated user needs to have the 'user:create' permission.",
  })
  @ApiBadRequestResponse({
    description: 'Invalid data was provided to create the user.',
  })
  @Post('user')
  @RequiresPermission('user:create')
  async create(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.userService.create(createUserDto);

    return new SerializedUser(newUser);
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a user.' })
  @ApiParam({
    name: 'id',
    required: true,
    description: "The 'id' of the user to update.",
    example: new ObjectId(),
  })
  @ApiOkResponse({
    example: new SerializedUser({
      _id: new ObjectId(),
      firstName: 'UpdatedFirstName',
      lastName: 'UpdatedLastName',
      email: 'updated-user@email.dev',
      permissions: ['user:list'],
    } as WithId<User>),
  })
  @ApiUnauthorizedResponse({
    description: 'An authenticated user is needed to access this route.',
  })
  @ApiForbiddenResponse({
    description:
      "The authenticated user needs to have the 'user:update:others' permission AND the specified user cannot be the authenticated user.",
  })
  @ApiBadRequestResponse({
    description: 'Invalid data was provided to update the user.',
  })
  @Patch('user/:id')
  @RequiresPermission(['user:update:others', { userId: 'id' }])
  async update(
    @Param('id', Entity(User)) { _id: userId }: WithId<User>,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.update(userId, updateUserDto);

    return new SerializedUser(updatedUser);
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete the specified user.' })
  @ApiParam({
    name: 'id',
    required: true,
    description: "The 'id' of the user to delete.",
    example: new ObjectId(),
  })
  @ApiNoContentResponse({ description: 'The specified user was deleted.' })
  @ApiUnauthorizedResponse({
    description: 'An authenticated user is needed to access this route.',
  })
  @ApiForbiddenResponse({
    description:
      "The authenticated user needs to have the 'user:delete:others' permission AND the specified user to delete cannot be the authenticated user.",
  })
  @Delete('user/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiresPermission(['user:delete:others', { userId: 'id' }])
  async delete(@Param('id', Entity(User)) { _id: userId }: WithId<User>) {
    await this.userService.delete(userId);
  }
}
