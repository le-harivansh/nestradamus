import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';

import { Administrator } from '@/_administration/_administrator/schema/administrator.schema';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { ADMINISTRATOR_PASSWORD_RESET } from '../event';
import { ForgotPasswordService } from '../service/forgot-password.service';

@Injectable()
export class PasswordResetListener {
  constructor(
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(PasswordResetListener.name);
  }

  @OnEvent(ADMINISTRATOR_PASSWORD_RESET)
  async handleAdministratorPasswordReset(
    administrator: HydratedDocument<Administrator>,
  ): Promise<void> {
    this.loggerService.log(
      'Handling administrator password-reset',
      administrator,
    );

    await this.forgotPasswordService.sendPasswordResetEmail(
      administrator.get('username'),
    );
  }
}
