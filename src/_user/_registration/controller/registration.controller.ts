import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle, seconds } from '@nestjs/throttler';
import { HydratedDocument } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { SerializeDocumentsHavingSchema } from '@/_library/interceptor/mongoose-document-serializer.interceptor';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';
import { UserTransformer } from '@/_user/_user/serializer/user.transformer';

import { RegistrationDto } from '../dto/registration.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { RegistrationService } from '../service/registration.service';

@Controller('register')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(RegistrationController.name);
  }

  @Post('send-otp')
  @Throttle({ default: { limit: 1, ttl: seconds(30) } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendOtp(@Body() { destination }: SendOtpDto): Promise<void> {
    this.loggerService.log('Request to send user-registration OTP', {
      destination,
    });

    await this.registrationService.sendVerificationOtpEmail(destination);
  }

  @Post()
  @UseInterceptors(SerializeDocumentsHavingSchema(UserSchema, UserTransformer))
  async register(
    @Body() { email, password, otp }: RegistrationDto,
  ): Promise<HydratedDocument<User>> {
    this.loggerService.log('Request to register user', { email });

    return this.registrationService.registerUser(email, password, otp);
  }
}
