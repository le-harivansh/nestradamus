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
import { HydratedDocument } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { SerializeDocumentsHavingSchema } from '@/_library/interceptor/mongoose-document-serializer.interceptor';
import { RequiresUserAccessToken } from '@/_user/_authentication/guard/requires-user-access-token.guard';

import { AuthenticatedUser } from '../decorator/user.decorator';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User, UserSchema } from '../schema/user.schema';
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
  get(
    @AuthenticatedUser() user: HydratedDocument<User>,
  ): HydratedDocument<User> {
    this.loggerService.log('Request to get authenticated user', user);

    return user;
  }

  @Patch()
  @UseInterceptors(SerializeDocumentsHavingSchema(UserSchema, UserTransformer))
  async update(
    @AuthenticatedUser() user: HydratedDocument<User>,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<HydratedDocument<User>> {
    this.loggerService.log('Request to update user', {
      user,
      data: updateUserDto,
    });

    const userUpdateData: Record<string, unknown> = { ...updateUserDto };

    /**
     * Here, we check if an 'email' property exists on the DTO, and if so,
     * it is renamed to 'username', and passed to the service.
     */
    if ('email' in userUpdateData) {
      userUpdateData['username'] = userUpdateData['email'];

      delete userUpdateData['email'];
    }

    return this.userService.update(user, userUpdateData);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @AuthenticatedUser() user: HydratedDocument<User>,
  ): Promise<void> {
    this.loggerService.log('Request to delete user', user);

    await this.userService.delete(user._id);
  }
}
