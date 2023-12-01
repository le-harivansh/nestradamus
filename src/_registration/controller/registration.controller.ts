import {
  BadRequestException,
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
import { UserService } from '@/_user/service/user.service';

import { RegisterUserDto } from '../dto/registration.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { RegistrationService } from '../service/registration.service';

@Controller('register')
export class RegistrationController {
  constructor(
    private readonly userService: UserService,
    private readonly registrationService: RegistrationService,
  ) {}

  @Post('send-otp')
  @Throttle({ default: { limit: 1, ttl: 60 * 1000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendOtp(@Body() { destination }: SendOtpDto): Promise<void> {
    await this.registrationService.sendOtpEmail(destination);
  }

  @Post()
  @UseInterceptors(SerializeDocumentsHavingSchema(UserSchema, SerializedUser))
  async register(
    @Body() { email, password, otp }: RegisterUserDto,
  ): Promise<UserDocument> {
    const otpIsValid = await this.registrationService.verifyOtp(otp, email);

    if (!otpIsValid) {
      throw new BadRequestException(
        `The user-registration OTP (${otp}) sent to: '${email}' is invalid`,
      );
    }

    return this.userService.create(email, password);
  }
}
