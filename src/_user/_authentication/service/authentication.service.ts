import { Injectable } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { AuthenticationService as AbstractAuthenticationService } from '@/_library/authentication/service/authentication.service';
import { User } from '@/_user/_user/schema/user.schema';
import { UserService } from '@/_user/_user/service/user.service';

@Injectable()
export class AuthenticationService extends AbstractAuthenticationService<User> {
  constructor(
    loggerService: WinstonLoggerService,
    private readonly userService: UserService,
  ) {
    loggerService.setContext(`${AuthenticationService.name}[${User.name}]`);

    super(loggerService);
  }

  override async retrieveAuthenticatableEntity(
    username: string,
  ): Promise<HydratedDocument<User>> {
    return this.userService.findOne({ username });
  }
}
