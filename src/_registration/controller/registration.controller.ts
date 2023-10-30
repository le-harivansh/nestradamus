import { Body, Controller, Post } from '@nestjs/common';

import { RequestUser } from '../../_user/schema/user.schema';
import { UserService } from '../../_user/service/user.service';
import { RegisterUserDto } from '../dto/registration.dto';

@Controller('register')
export class RegistrationController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<RequestUser> {
    const { _id: id, username } =
      await this.userService.createUser(registerUserDto);

    return {
      id: id.toString(),
      username,
    };
  }
}
