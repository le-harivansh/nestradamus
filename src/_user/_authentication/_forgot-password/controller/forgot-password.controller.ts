import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle, seconds } from '@nestjs/throttler';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { ForgotPasswordService } from '../service/forgot-password.service';

@Controller('forgot-password')
export class ForgotPasswordController {
  constructor(
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(ForgotPasswordController.name);
  }

  @Post('send-otp')
  @Throttle({ default: { limit: 1, ttl: seconds(30) } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendOtp(@Body() { destination }: SendOtpDto): Promise<void> {
    this.loggerService.log('Received forgot-password OTP request', {
      destination,
    });

    await this.forgotPasswordService.sendOtpEmail(destination);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() { email, password, otp }: ResetPasswordDto,
  ): Promise<void> {
    this.loggerService.log('Received password-reset request', { email });

    await this.forgotPasswordService.resetPassword(email, password, otp);
  }
}
