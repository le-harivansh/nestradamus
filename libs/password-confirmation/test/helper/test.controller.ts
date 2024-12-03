import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { RequiresPasswordConfirmation } from '@library/password-confirmation';

export const TEST_BASE_ROUTE = 'test';
export const UNAUTHENTICATED_ROUTE = 'unauthenticated';

@Controller(TEST_BASE_ROUTE)
export class TestController {
  @Get(UNAUTHENTICATED_ROUTE)
  @UseGuards(RequiresPasswordConfirmation)
  unauthenticated() {}

  @Get()
  @UseGuards(RequiresPasswordConfirmation)
  @HttpCode(HttpStatus.NO_CONTENT)
  authenticated() {}
}
