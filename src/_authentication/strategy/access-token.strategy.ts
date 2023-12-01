import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserDocument } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { TokenService } from '../_token/service/token.service';
import { Guard, JwtType, TokenHttpHeader } from '../constant';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  Guard.ACCESS_TOKEN,
) {
  constructor(
    tokenService: TokenService,
    private readonly userService: UserService,
  ) {
    super({
      secretOrKey: tokenService.getSecret(JwtType.ACCESS_TOKEN),
      jwtFromRequest: ExtractJwt.fromHeader(TokenHttpHeader.ACCESS_TOKEN),
      issuer: tokenService.JWT_ISSUER,
      audience: tokenService.JWT_AUDIENCE,
      algorithms: [tokenService.JWT_ALGORITHM],
      jsonWebTokenOptions: {
        subject: JwtType.ACCESS_TOKEN,
      },
    });
  }

  async validate({ userId }: { userId: string }): Promise<UserDocument | null> {
    try {
      /**
       * We return the `await`ed  result here so that if an exception occurs,
       * it is caught in the current tick/microtask; allowing the `try - catch`
       * to actually catch the exception.
       *
       * @see: https://stackoverflow.com/a/50494803/19659236
       */
      return await this.userService.findOneBy('_id', userId);
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

    return null;
  }
}
