import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { RequiresAccessToken } from '@/_authentication/guard/requires-access-token.guard';
import { SerializeDocumentsHavingSchema } from '@/_library/interceptor/mongoose-document-serializer.interceptor';

import { User as AuthenticatedUser } from '../decorator/user.decorator';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserDocument, UserSchema } from '../schema/user.schema';
import { User as SerializedUser } from '../serializer/user.serializer';
import { UserService } from '../service/user.service';

@Controller('me')
@UseGuards(RequiresAccessToken)
@UseInterceptors(SerializeDocumentsHavingSchema(UserSchema, SerializedUser))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  get(@AuthenticatedUser() user: UserDocument): UserDocument {
    return user;
  }

  @Patch()
  async update(
    @AuthenticatedUser('_id') userId: Types.ObjectId,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.userService.update(userId, updateUserDto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @AuthenticatedUser('_id') userId: Types.ObjectId,
  ): Promise<void> {
    await this.userService.delete(userId);
  }
}
