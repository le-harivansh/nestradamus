import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { RequestUser } from '../../user/schema/user.schema';
import { UserService } from '../../user/service/user.service';
import { Guard } from '../helpers';
import { AuthenticationService } from '../service/authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, Guard.LOCAL) {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly userService: UserService,
  ) {
    super();
  }

  async validate(username: string, password: string): Promise<RequestUser> {
    if (
      !(await this.authenticationService.credentialsAreValid(
        username,
        password,
      ))
    ) {
      throw new UnauthorizedException('The provided credentials are invalid.');
    }

    const { _id: id } = await this.userService.findByUsername(username);

    return {
      id: id.toString(),
      username,
    };
  }
}
