import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { AuthenticationController } from '@/_authentication/controller/authentication.controller';
import { OtpService } from '@/_library/_otp/service/otp.service';
import { UserTransformer } from '@/_user/serializer/user.transformer';

import { Mailhog } from './mailhog';

/**
 * User registration helpers
 */

export async function getRegistrationOtp(
  email: string,
  {
    httpServer,
    mailhog,
  }: { httpServer: NestExpressApplication; mailhog: Mailhog },
): Promise<string> {
  const otpRequestSentAt = new Date();

  await request(httpServer)
    .post('/register/send-otp')
    .send({ destination: email });

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
    otp = await getRegistrationOtp(email, {
      httpServer,
      mailhog,
    }),
  } = userData;

  const { login = false } = options ?? {};

  const { status, body } = await request(httpServer).post('/register').send({
    email,
    password,
    otp,
  });

  if (status !== HttpStatus.CREATED) {
    throw new InternalServerErrorException(
      `Could not create the user: '${email}'`,
    );
  }

  if (!login) {
    return body as Omit<UserTransformer, 'password'>;
  }

  const { body: authenticationTokens } = await request(httpServer)
    .post('/login')
    .send({ email, password });

  return authenticationTokens as ReturnType<AuthenticationController['login']>;
}

/**
 * User forgot-password helpers
 */

export async function getForgotPasswordOtp(
  email: string,
  {
    httpServer,
    mailhog,
  }: { httpServer: NestExpressApplication; mailhog: Mailhog },
): Promise<string> {
  const emailContent =
    'Hi, enter the following OTP to reset your password for the account';
  const forgotPasswordOtpRegexp = new RegExp(
    `${emailContent}\\s+${email}.\\s+(\\d{${OtpService.PASSWORD_LENGTH}})`,
  );

  const otpRequestSentAt = new Date();

  await request(httpServer)
    .post('/forgot-password/send-otp')
    .send({ destination: email });

  const otpEmail = await mailhog.getLatestEmail({
    notBefore: otpRequestSentAt,
    contents: emailContent,
    to: email,
  });

  const otp = otpEmail.text.match(forgotPasswordOtpRegexp)![1] ?? null;

  if (!otp) {
    throw new InternalServerErrorException(
      `Could not retrieve the forgot-password OTP for the user: '${email}'`,
    );
  }

  await mailhog.api.deleteMessage(otpEmail.ID);

  return otp;
}
