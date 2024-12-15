import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { ROUTES } from '../constant';
import { User } from '../user.entity';
import { ShouldExist, ShouldNotExist } from '../validator';

// DTOs

class ExplicitShouldExistDto {
  @ShouldExist(User, 'username')
  readonly username!: string;
}

class ExplicitShouldNotExistDto {
  @ShouldNotExist(User, 'username')
  readonly username!: string;
}

class ImplicitShouldExistDto {
  @ShouldExist(User)
  readonly username!: string;
}

class ImplicitShouldNotExistDto {
  @ShouldNotExist(User)
  readonly username!: string;
}

// Controller

@Controller(ROUTES.USERNAME.BASE)
export class UsernameTestController {
  @Post(ROUTES.USERNAME.IMPLICIT_SHOULD_EXIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  implicitShouldExist(@Body() implicitShouldExistDto: ImplicitShouldExistDto) {
    return implicitShouldExistDto;
  }

  @Post(ROUTES.USERNAME.EXPLICIT_SHOULD_EXIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  explicitShouldExist(@Body() explicitShouldExistDto: ExplicitShouldExistDto) {
    return explicitShouldExistDto;
  }

  @Post(ROUTES.USERNAME.IMPLICIT_SHOULD_NOT_EXIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  implicitShouldNotExist(
    @Body()
    implicitShouldNotExistDto: ImplicitShouldNotExistDto,
  ) {
    return implicitShouldNotExistDto;
  }

  @Post(ROUTES.USERNAME.EXPLICIT_SHOULD_NOT_EXIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  explicitShouldNotExist(
    @Body()
    explicitShouldNotExistDto: ExplicitShouldNotExistDto,
  ) {
    return explicitShouldNotExistDto;
  }
}
