import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { verify } from 'argon2';
import { Strategy } from 'passport-local';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { User, UserDocument } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { Guard } from '../constant';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, Guard.LOCAL) {
  constructor(
    private readonly userService: UserService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    /**
     * This variable's purpose is to "hard-assert" the existence of the key
     * of the `usernameField` being used for user authentication.
     */
    const usernameField: Extract<keyof User, 'email'> = 'email';

    super({
      usernameField,
    });

    this.loggerService.setContext(LocalStrategy.name);
  }

  async validate(email: string, password: string) {
    let retrievedUser: UserDocument | null = null;

    try {
      retrievedUser = await this.userService.findOne({ email });
    } catch (error) {
      /**
       * We want to re-throw any exception that is **NOT** a `NotFoundException`,
       * since `findOneBy` only throws `NotFoundException`s. Any other exception
       * caught here would most likely have been thrown by the framework; and
       * we **DO NOT** want to catch those.
       */
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    retrievedUser =
      retrievedUser && (await verify(retrievedUser.get('password'), password))
        ? retrievedUser
        : null;

    if (retrievedUser) {
      this.loggerService.log('Successful user login attempt', retrievedUser);
    } else {
      this.loggerService.log('Unsuccessful user login attempt', { email });
    }

    return retrievedUser;
  }
}
