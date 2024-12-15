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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WithId } from 'mongodb';

import { RequiresPasswordConfirmation } from '@library/password-confirmation';

import { AuthenticatedUser } from '../../_authentication/decorator/authenticated-user.decorator';
import { RequiresPermission } from '../../_authorization/decorator/requires-permission.decorator';
import { Entity } from '../../_database/pipe';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUserDto } from '../dto/list-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { SerializedUser, User } from '../schema/user.schema';
import { UserService } from '../service/user.service';

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Get('user')
  @RequiresPermission('user:read:own')
  showAuthenticatedUser(@AuthenticatedUser() authenticatedUser: WithId<User>) {
    return new SerializedUser(authenticatedUser);
  }

  @Get('user/:id')
  @RequiresPermission(['user:read:others', { userId: 'id' }])
  show(@Param('id', Entity(User)) user: WithId<User>) {
    return new SerializedUser(user);
  }

  @Post('user')
  @RequiresPermission('user:create')
  async create(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.userService.create(createUserDto);

    return new SerializedUser(newUser);
  }

  @Patch('user')
  @UseGuards(RequiresPasswordConfirmation)
  @RequiresPermission('user:update:own')
  async updateAuthenticatedUser(
    @AuthenticatedUser() { _id: userId }: WithId<User>,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.update(userId, updateUserDto);

    return new SerializedUser(updatedUser);
  }

  @Patch('user/:id')
  @RequiresPermission(['user:update:others', { userId: 'id' }])
  async update(
    @Param('id', Entity(User)) { _id: userId }: WithId<User>,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.update(userId, updateUserDto);

    return new SerializedUser(updatedUser);
  }

  @Delete('user')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RequiresPasswordConfirmation)
  @RequiresPermission('user:delete:own')
  async deleteAuthenticatedUser(
    @AuthenticatedUser() { _id: userId }: WithId<User>,
  ) {
    await this.userService.delete(userId);
  }

  @Delete('user/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiresPermission(['user:delete:others', { userId: 'id' }])
  async delete(@Param('id', Entity(User)) { _id: userId }: WithId<User>) {
    await this.userService.delete(userId);
  }
}
