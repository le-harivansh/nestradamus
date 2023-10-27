import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { RequiresAccessToken } from '../../_authentication/guard/requires-access-token.guard';
import { User } from '../decorator/user.decorator';
import { UpdateUserDto } from '../dto/update-user.dto';
import { RequestUser } from '../schema/user.schema';
import { UserService } from '../service/user.service';

@Controller('me')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(RequiresAccessToken)
  get(@User() user: RequestUser) {
    return user;
  }

  @Patch()
  @UseGuards(RequiresAccessToken)
  @UsePipes(ValidationPipe)
  async update(
    @User('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUserWithId(userId, updateUserDto);
  }

  @Delete()
  @UseGuards(RequiresAccessToken)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@User('id') userId: string) {
    await this.userService.deleteById(userId);
  }
}
