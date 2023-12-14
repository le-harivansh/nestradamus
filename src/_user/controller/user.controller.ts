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

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { RequiresUserAccessToken } from '@/_authentication/guard/requires-user-access-token.guard';
import { SerializeDocumentsHavingSchema } from '@/_library/interceptor/mongoose-document-serializer.interceptor';

import { User as AuthenticatedUser } from '../decorator/user.decorator';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserDocument, UserSchema } from '../schema/user.schema';
import { UserTransformer } from '../serializer/user.transformer';
import { UserService } from '../service/user.service';

@Controller('me')
@UseGuards(RequiresUserAccessToken)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(UserController.name);
  }

  @Get()
  @UseInterceptors(SerializeDocumentsHavingSchema(UserSchema, UserTransformer))
  get(@AuthenticatedUser() user: UserDocument): UserDocument {
    this.loggerService.log('Request to get authenticated user', user);

    return user;
  }

  @Patch()
  @UseInterceptors(SerializeDocumentsHavingSchema(UserSchema, UserTransformer))
  async update(
    @AuthenticatedUser() user: UserDocument,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    this.loggerService.log('Request to update user', {
      user,
      data: updateUserDto,
    });

    return this.userService.update(user._id, updateUserDto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@AuthenticatedUser() user: UserDocument): Promise<void> {
    this.loggerService.log('Request to delete user', user);

    await this.userService.delete(user._id);
  }
}
