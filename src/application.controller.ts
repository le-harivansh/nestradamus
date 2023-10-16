import { Controller, Get } from '@nestjs/common';
import { ApplicationService } from './application.service';

@Controller()
export class ApplicationController {
  constructor(private readonly appService: ApplicationService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
