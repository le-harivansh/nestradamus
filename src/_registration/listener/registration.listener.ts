import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { Event } from '@/_application/_event/type';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { UserDocument } from '@/_user/schema/user.schema';

import { RegistrationService } from '../service/registration.service';

@Injectable()
export class RegistrationListener {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(RegistrationListener.name);
  }

  @OnEvent(Event.User.REGISTERED)
  async handleUserRegistration(user: UserDocument): Promise<void> {
    this.loggerService.log('Handling user-registration event', user);

    await this.registrationService.sendWelcomeEmail(user.get('email'));
  }
}
