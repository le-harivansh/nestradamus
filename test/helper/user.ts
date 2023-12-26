import {
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { OtpService } from '@/_library/_otp/service/otp.service';
import { AuthenticationController } from '@/_user/_authentication/controller/authentication.controller';
import { UserTransformer } from '@/_user/_user/serializer/user.transformer';

import { Mailhog } from './mailhog';

/*****************************
 * User registration helpers *
 *****************************/

/**
 * Register a new user, and optionally log it in.
 */
export async function registerUser(
  userData: { email: string; password: string; otp?: string },
  configuration: {
    httpServer: NestExpressApplication;
    mailhog: Mailhog;
  },
  options: {
    login: true;
  },
): ReturnType<AuthenticationController['login']>;
export async function registerUser(
  userData: { email: string; password: string; otp?: string },
  configuration: {
    httpServer: NestExpressApplication;
    mailhog: Mailhog;
  },
): Promise<Omit<UserTransformer, 'password'>>;
export async function registerUser(
  userData: { email: string; password: string; otp?: string },
  configuration: {
    httpServer: NestExpressApplication;
    mailhog: Mailhog;
  },
  options?: {
    login: boolean;
  },
) {
  const { httpServer, mailhog } = configuration;

  const {
    email,
    password,
    otp = await getUserRegistrationOtp(email, {
      httpServer,
      mailhog,
    }),
  } = userData;

  const { status: registrationStatus, body } = await request(httpServer)
    .post('/register')
    .send({
      email,
      password,
      otp,
    });

  if (registrationStatus !== HttpStatus.CREATED) {
    throw new InternalServerErrorException(
      `Could not create the user: '${email}'`,
    );
  }

  const { login = false } = options ?? {};

  if (!login) {
    return body;
  }

  const { status: loginStatus, body: authenticationTokens } = await request(
    httpServer,
  )
    .post('/login')
    .send({ email, password });

  if (loginStatus !== HttpStatus.OK) {
    throw new BadRequestException(
      `Could not log in user: [username: ${email}, password: ${password}].`,
    );
  }

  return authenticationTokens;
}

/**
 * Sends a user-registration OTP request, and when the OTP email is received,
 * it retrieves the OTP from the email, then deletes the email.
 */
export async function getUserRegistrationOtp(
  email: string,
  {
    httpServer,
    mailhog,
  }: { httpServer: NestExpressApplication; mailhog: Mailhog },
): Promise<string> {
  const otpRequestSentAt = new Date();

  const { status: sendUserRegistrationOtpStatus } = await request(httpServer)
    .post('/register/send-otp')
    .send({ destination: email });

  if (sendUserRegistrationOtpStatus !== HttpStatus.NO_CONTENT) {
    throw new BadRequestException(
      `Could not send user-registration OTP to: ${email}.`,
    );
  }

  const otpEmail = await mailhog.getLatestEmail({
    notBefore: otpRequestSentAt,
    contents: 'Your one-time pin is',
    to: email,
  });

  const otp =
    otpEmail.text.match(
      new RegExp(
        `Your one-time pin is:\\s+(\\d{${OtpService.PASSWORD_LENGTH}})`,
      ),
    )![1] ?? null;

  if (!otp) {
    throw new InternalServerErrorException(
      `Could not retrieve the registration OTP for the user: '${email}'`,
    );
  }

  await mailhog.api.deleteMessage(otpEmail.ID);

  return otp;
}

/********************************
 * User forgot-password helpers *
 ********************************/

/**
 * Sends a user forgot-password OTP request, and when the OTP email is received,
 * it retrieves the OTP from the email, then deletes the email.
 */
export async function getUserForgotPasswordOtp(
  email: string,
  {
    httpServer,
    mailhog,
  }: { httpServer: NestExpressApplication; mailhog: Mailhog },
): Promise<string> {
  const otpRequestSentAt = new Date();

  const { status: sendUserForgotPasswordOtpStatus } = await request(httpServer)
    .post('/forgot-password/send-otp')
    .send({ destination: email });

  if (sendUserForgotPasswordOtpStatus !== HttpStatus.NO_CONTENT) {
    throw new BadRequestException(
      `Could not send user forgot-password OTP to: ${email}.`,
    );
  }

  const emailContent =
    'Hi, enter the following OTP to reset your password for the account';

  const otpEmail = await mailhog.getLatestEmail({
    notBefore: otpRequestSentAt,
    contents: emailContent,
    to: email,
  });

  const forgotPasswordOtpRegexp = new RegExp(
    `${emailContent}\\s+${email}.\\s+(\\d{${OtpService.PASSWORD_LENGTH}})`,
  );
  const otp = otpEmail.text.match(forgotPasswordOtpRegexp)![1] ?? null;

  if (!otp) {
    throw new InternalServerErrorException(
      `Could not retrieve the forgot-password OTP for the user: '${email}'`,
    );
  }

  await mailhog.api.deleteMessage(otpEmail.ID);

  return otp;
}
