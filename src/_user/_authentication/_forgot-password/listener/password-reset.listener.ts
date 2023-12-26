import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { User } from '@/_user/_user/schema/user.schema';

import { USER_PASSWORD_RESET } from '../event';
import { ForgotPasswordService } from '../service/forgot-password.service';

@Injectable()
export class PasswordResetListener {
  constructor(
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(PasswordResetListener.name);
  }

  @OnEvent(USER_PASSWORD_RESET)
  async handleUserPasswordReset(user: HydratedDocument<User>): Promise<void> {
    this.loggerService.log('Handling user password-reset', user);

    await this.forgotPasswordService.sendPasswordResetEmail(
      user.get('username'),
    );
  }
}
