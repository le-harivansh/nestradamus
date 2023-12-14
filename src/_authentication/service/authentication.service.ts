import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'argon2';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { UserDocument } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(AuthenticationService.name);
  }

  async authenticateUserUsingCredentials(
    username: string,
    password: string,
  ): Promise<UserDocument> {
    let retrievedUser: UserDocument | null = null;

    try {
      retrievedUser = await this.userService.findOne({ email: username });
    } catch (error) {
      /**
       * We want to re-throw any exception that is **NOT** a `NotFoundException`,
       * since `findOne` only throws `NotFoundException`s. Any other exception
       * caught here would most likely have been thrown by the framework; and
       * we **DO NOT** want to catch those.
       */
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    if (
      retrievedUser &&
      (await verify(retrievedUser.get('password'), password))
    ) {
      this.loggerService.log(
        'Valid credentials provided for user',
        retrievedUser,
      );

      return retrievedUser;
    }

    throw new UnauthorizedException('Invalid credentials.');
  }
}
