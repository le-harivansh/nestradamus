import { NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Types } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { UserDocument } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { TokenService } from '../_token/service/token.service';
import { Guard, JwtType, TokenHttpHeader } from '../constant';

export function JwtStrategy(name: Guard): new (
  type: JwtType,
  httpHeader: TokenHttpHeader,
  tokenService: TokenService,
  loggerService: WinstonLoggerService,
  userService: UserService,
) => Strategy & {
  validate(payload: { userId: string }): Promise<UserDocument | null>;
} {
  return class extends PassportStrategy(Strategy, name) {
    constructor(
      type: JwtType,
      httpHeader: TokenHttpHeader,
      tokenService: TokenService,
      private readonly loggerService: WinstonLoggerService,
      private readonly userService: UserService,
    ) {
      super({
        secretOrKey: tokenService.getSecret(type),
        jwtFromRequest: ExtractJwt.fromHeader(httpHeader),
        issuer: tokenService.JWT_ISSUER,
        audience: tokenService.JWT_AUDIENCE,
        algorithms: [tokenService.JWT_ALGORITHM],
        jsonWebTokenOptions: {
          subject: type,
        },
      });

      this.loggerService.setContext(`${JwtStrategy.name} - ${name}`);
    }

    async validate({
      userId,
    }: {
      userId: string;
    }): Promise<UserDocument | null> {
      let retrievedUser: UserDocument | null = null;

      try {
        /**
         * We return the `await`ed  result here so that if an exception occurs,
         * it is caught in the current tick/microtask; allowing the `try - catch`
         * to actually catch the exception.
         *
         * @see: https://stackoverflow.com/a/50494803/19659236
         */
        retrievedUser = await this.userService.findOne(
          new Types.ObjectId(userId),
        );
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

      if (retrievedUser) {
        this.loggerService.log('Token validated for user', retrievedUser);
      } else {
        this.loggerService.log('Could not retrieve user', {
          id: userId,
        });
      }

      return retrievedUser;
    }
  };
}
