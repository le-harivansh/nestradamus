import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { Event } from '@/_application/_event/type';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { UserDocument } from '@/_user/_user/schema/user.schema';

import { ForgotPasswordService } from '../service/forgot-password.service';

@Injectable()
export class PasswordResetListener {
  constructor(
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(PasswordResetListener.name);
  }

  @OnEvent(Event.User.PASSWORD_RESET)
  async handleUserPasswordReset(user: UserDocument): Promise<void> {
    this.loggerService.log('Handling password-reset', user);

    await this.forgotPasswordService.sendPasswordResetEmail(user.get('email'));
  }
}
