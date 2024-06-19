import { Controller, Get } from '@nestjs/common';

import { AdministrationService } from './administration.service';

@Controller()
export class AdministrationController {
  constructor(private readonly administrationService: AdministrationService) {}

  @Get()
  getHello(): string {
    return this.administrationService.getHello();
  }
}
