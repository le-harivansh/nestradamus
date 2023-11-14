import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { RequestUser } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { TokenService } from '../_token/service/token.service';
import { Guard, JwtType, TokenHttpHeader } from '../helper';

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

  async validate({ userId }: { userId: string }): Promise<RequestUser> {
    const retrievedUser = await this.userService.findOneBy('_id', userId);

    if (!retrievedUser) {
      throw new UnauthorizedException('The requested user no longer exists.');
    }

    return { id: userId, email: retrievedUser.email };
  }
}
