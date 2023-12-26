import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { User } from '@/_user/_user/schema/user.schema';

import { USER_REGISTERED } from '../event';
import { RegistrationService } from '../service/registration.service';

@Injectable()
export class RegistrationListener {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(RegistrationListener.name);
  }

  @OnEvent(USER_REGISTERED)
  async handleUserRegistration(user: HydratedDocument<User>): Promise<void> {
    this.loggerService.log('Handling user-registration event', user);

    await this.registrationService.sendWelcomeEmail(user.get('username'));
  }
}
