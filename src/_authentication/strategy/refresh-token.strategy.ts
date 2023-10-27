import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { RequestUser } from '../../_user/schema/user.schema';
import { UserService } from '../../_user/service/user.service';
import { TokenService } from '../_token/service/token.service';
import { Guard, JwtType, TokenHttpHeader } from '../helpers';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  Guard.REFRESH_TOKEN,
) {
  constructor(
    tokenService: TokenService,
    private readonly userService: UserService,
  ) {
    super({
      secretOrKey: tokenService.getSecret(JwtType.REFRESH_TOKEN),
      jwtFromRequest: ExtractJwt.fromHeader(TokenHttpHeader.REFRESH_TOKEN),
      issuer: tokenService.JWT_ISSUER,
      audience: tokenService.JWT_AUDIENCE,
      algorithms: [tokenService.JWT_ALGORITHM],
      jsonWebTokenOptions: {
        subject: JwtType.REFRESH_TOKEN,
      },
    });
  }

  async validate({ userId }: { userId: string }): Promise<RequestUser> {
    const retrievedUser = await this.userService.findById(userId);

    if (!retrievedUser) {
      throw new UnauthorizedException('The requested user no longer exists.');
    }

    return { id: userId, username: retrievedUser.username };
  }
}
