import { Injectable } from '@nestjs/common';
import { verify } from 'argon2';

import { UserService } from '../../user/service/user.service';

@Injectable()
export class AuthenticationService {
  constructor(private readonly userService: UserService) {}

  async credentialsAreValid(username: string, password: string) {
    const retrievedUser = await this.userService.findByUsername(username);

    return !!retrievedUser && (await verify(retrievedUser.password, password));
  }
}
