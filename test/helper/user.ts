import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { AuthenticationController } from '@/_authentication/controller/authentication.controller';
import { User } from '@/_user/serializer/user.serializer';

import { Mailhog } from './mailhog';

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
    otpEmail.text.match(/Your one-time pin is:\s+(\d{6})/)![1] ?? null;

  if (!otp) {
    throw new InternalServerErrorException(
      `Could not retrieve the OTP when creating user: '${email}'`,
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
): Promise<Omit<User, 'password'>>;
export async function registerUser(
  userData: { email: string; password: string; otp?: string },
  configuration: {
    httpServer: NestExpressApplication;
    mailhog: Mailhog;
  },
  options: {
    login: true;
  },
): Promise<ReturnType<AuthenticationController['login']>>;
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
    return body as Omit<User, 'password'>;
  }

  const { body: authenticationTokens } = await request(httpServer)
    .post('/login')
    .send({ email, password });

  return authenticationTokens as ReturnType<AuthenticationController['login']>;
}
