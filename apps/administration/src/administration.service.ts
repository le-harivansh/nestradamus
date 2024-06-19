import { Injectable } from '@nestjs/common';

@Injectable()
export class AdministrationService {
  private readonly message = '[ADMIN] Hello World!';
  getHello(): string {
    return this.message;
  }
}
