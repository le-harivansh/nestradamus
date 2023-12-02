import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { SerializeDocumentsHavingSchema } from '@/_library/interceptor/mongoose-document-serializer.interceptor';
import { UserDocument, UserSchema } from '@/_user/schema/user.schema';
import { User as SerializedUser } from '@/_user/serializer/user.serializer';

import { RegisterUserDto } from '../dto/registration.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { RegistrationService } from '../service/registration.service';

@Controller('register')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('send-otp')
  @Throttle({ default: { limit: 1, ttl: 60 * 1000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendOtp(@Body() { destination }: SendOtpDto): Promise<void> {
    await this.registrationService.sendEmailVerificationOtpEmail(destination);
  }

  @Post()
  @UseInterceptors(SerializeDocumentsHavingSchema(UserSchema, SerializedUser))
  async register(
    @Body() { email, password, otp }: RegisterUserDto,
  ): Promise<UserDocument> {
    return this.registrationService.registerUser(email, password, otp);
  }
}
