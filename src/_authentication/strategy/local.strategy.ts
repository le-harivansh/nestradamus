import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { verify } from 'argon2';
import { Strategy } from 'passport-local';

import { ModelWithId } from '@/_library/helper';
import { RequestUser, User } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { Guard } from '../helper';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, Guard.LOCAL) {
  constructor(private readonly userService: UserService) {
    super();
  }

  async validate(username: string, password: string): Promise<RequestUser> {
    let retrievedUser: ModelWithId<User> | null = null;

    try {
      retrievedUser = await this.userService.findOneBy('username', username);
    } catch (error) {
      /**
       * We want to re-throw any exception that is **NOT** a `NotFoundException`,
       * since `findOneBy` only throws `NotFoundException`s. Any other exception
       * caught here would most likely have been emitted by the framework; and
       * we **DO NOT** want to catch those.
       */
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    if (!retrievedUser || !(await verify(retrievedUser.password, password))) {
      throw new UnauthorizedException('The provided credentials are invalid.');
    }

    return {
      id: retrievedUser._id.toString(),
      username,
    };
  }
}
