import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { USER_REGISTERED } from '@/_application/event.constant';
import { UserDocument } from '@/_user/schema/user.schema';

import { RegistrationService } from '../service/registration.service';

@Injectable()
export class RegistrationListener {
  constructor(private readonly registrationService: RegistrationService) {}

  @OnEvent(USER_REGISTERED)
  async handleUserRegistration({ email }: UserDocument): Promise<void> {
    await this.registrationService.sendWelcomeEmail(email);
  }
}
