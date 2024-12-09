import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { ROUTES } from '../constant';
import { User } from '../user.model';
import { ShouldExist, ShouldNotExist } from '../validator';

// DTOs

class ExplicitShouldExistDto {
  @ShouldExist(User, '_id')
  readonly id!: string;
}

class ExplicitShouldNotExistDto {
  @ShouldNotExist(User, '_id')
  readonly id!: string;
}

class ImplicitShouldExistDto {
  @ShouldExist(User)
  readonly id!: string;
}

class ImplicitShouldNotExistDto {
  @ShouldNotExist(User)
  readonly id!: string;
}

// Controller

@Controller(ROUTES.ID.BASE)
export class UserIdTestController {
  @Post(ROUTES.ID.IMPLICIT_SHOULD_EXIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  implicitShouldExist(@Body() implicitShouldExistDto: ImplicitShouldExistDto) {
    return implicitShouldExistDto;
  }

  @Post(ROUTES.ID.EXPLICIT_SHOULD_EXIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  explicitShouldExist(@Body() explicitShouldExistDto: ExplicitShouldExistDto) {
    return explicitShouldExistDto;
  }

  @Post(ROUTES.ID.IMPLICIT_SHOULD_NOT_EXIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  implicitShouldNotExist(
    @Body()
    implicitShouldNotExistDto: ImplicitShouldNotExistDto,
  ) {
    return implicitShouldNotExistDto;
  }

  @Post(ROUTES.ID.EXPLICIT_SHOULD_NOT_EXIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  explicitShouldNotExist(
    @Body()
    explicitShouldNotExistDto: ExplicitShouldNotExistDto,
  ) {
    return explicitShouldNotExistDto;
  }
}
