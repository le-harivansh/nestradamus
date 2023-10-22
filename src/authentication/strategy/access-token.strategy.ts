import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { RequestUser } from '../../user/schema/user.schema';
import { UserService } from '../../user/service/user.service';
import { Guard, JwtType, TokenHttpHeader } from '../helpers';
import { TokenService } from '../token/token.service';

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
    const { username } = await this.userService.findById(userId);

    return { id: userId, username };
  }
}
