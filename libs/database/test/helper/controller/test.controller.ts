import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import {
  EXPLICIT_USERNAME_SHOULD_EXIST_ROUTE,
  EXPLICIT_USERNAME_SHOULD_NOT_EXIST_ROUTE,
  IMPLICIT_USERNAME_SHOULD_EXIST_ROUTE,
  IMPLICIT_USERNAME_SHOULD_NOT_EXIST_ROUTE,
  TEST_BASE_ROUTE,
} from '../constant';
import { ExplicitUsernameShouldExistDto } from '../dto/explicit-username-should-exist.dto';
import { ExplicitUsernameShouldNotExistDto } from '../dto/explicit-username-should-not-exist.dto';
import { ImplicitUsernameShouldExistDto } from '../dto/implicit-username-should-exist.dto';
import { ImplicitUsernameShouldNotExistDto } from '../dto/implicit-username-should-not-exist.dto';

@Controller(TEST_BASE_ROUTE)
export class TestController {
  @Post(IMPLICIT_USERNAME_SHOULD_EXIST_ROUTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  implicitUsernameShouldExist(
    @Body() implicitUsernameShouldExistDto: ImplicitUsernameShouldExistDto,
  ) {
    return implicitUsernameShouldExistDto;
  }

  @Post(EXPLICIT_USERNAME_SHOULD_EXIST_ROUTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  explicitUsernameShouldExist(
    @Body() explicitUsernameShouldExistDto: ExplicitUsernameShouldExistDto,
  ) {
    return explicitUsernameShouldExistDto;
  }

  @Post(IMPLICIT_USERNAME_SHOULD_NOT_EXIST_ROUTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  implicitUsernameShouldNotExist(
    @Body()
    implicitUsernameShouldNotExistDto: ImplicitUsernameShouldNotExistDto,
  ) {
    return implicitUsernameShouldNotExistDto;
  }

  @Post(EXPLICIT_USERNAME_SHOULD_NOT_EXIST_ROUTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  explicitUsernameShouldNotExist(
    @Body()
    explicitUsernameShouldNotExistDto: ExplicitUsernameShouldNotExistDto,
  ) {
    return explicitUsernameShouldNotExistDto;
  }
}
