import {
  BadRequestException,
  HttpServer,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Connection, HydratedDocument } from 'mongoose';
import request from 'supertest';

import {
  Administrator,
  AdministratorSchema,
} from '@/_administration/_administrator/schema/administrator.schema';
import { AuthenticationController } from '@/_administration/_authentication/controller/authentication.controller';
import { LoginDto } from '@/_administration/_authentication/dto/login.dto';
import { HOST } from '@/_administration/constant';
import { OtpService } from '@/_library/_otp/service/otp.service';

import { Mailhog } from './mailhog';

// @todo: Rewrite this function to create a new administrator using the same
//        steps as a user of the application would.
/**
 * Create a new administrator.
 *
 * Note: For the time being, we are using the database connection because there
 * is no other way to create (& save) a new administrator to the database.
 */
export async function createAdministrator(
  administrator: Administrator,
  databaseConnection: Connection,
): Promise<HydratedDocument<Administrator>>;
export async function createAdministrator(
  administrator: Administrator,
  databaseConnection: Connection,
  httpServer: HttpServer,
  options: { login: true },
): ReturnType<AuthenticationController['login']>;
export async function createAdministrator(
  administrator: Administrator,
  databaseConnection: Connection,
  httpServer?: HttpServer,
  options?: { login: boolean },
) {
  const administratorModel = databaseConnection.model(
    Administrator.name,
    AdministratorSchema,
  );

  const newAdministrator = await administratorModel.create(administrator);

  const { login = false } = options ?? {};

  if (!httpServer || !login) {
    return newAdministrator;
  }

  const credentials: LoginDto = {
    email: administrator.username,
    password: administrator.password,
  };

  const { status: loginStatus, body: authenticationTokens } = await request(
    httpServer,
  )
    .post('/login')
    .set('Host', HOST)
    .send(credentials);

  if (loginStatus !== HttpStatus.OK) {
    throw new BadRequestException(
      `Could not log in administrator: [username: ${administrator.username}, password: ${administrator.password}].`,
    );
  }

  return authenticationTokens;
}

/*****************************************
 * Administrator forgot-password helpers *
 *****************************************/

/**
 * Sends an administrator forgot-password OTP request, and when the OTP email
 * is received, it retrieves the OTP from the email, then deletes the email.
 */
export async function getForgotPasswordOtp(
  email: string,
  {
    httpServer,
    mailhog,
  }: { httpServer: NestExpressApplication; mailhog: Mailhog },
): Promise<string> {
  const otpRequestSentAt = new Date();

  const { status: sendAdministratorForgotPasswordOtpStatus } = await request(
    httpServer,
  )
    .post('/forgot-password/send-otp')
    .set('Host', HOST)
    .send({ destination: email });

  if (sendAdministratorForgotPasswordOtpStatus !== HttpStatus.NO_CONTENT) {
    throw new BadRequestException(
      `Could not send administrator forgot-password OTP to: ${email}.`,
    );
  }

  const emailContentTemplate =
    'Hi, enter the following OTP to reset your password for the [SEPARATOR]administrator account';

  const otpEmail = await mailhog.getLatestEmail({
    notBefore: otpRequestSentAt,
    contents: emailContentTemplate.replace('[SEPARATOR]', Mailhog.NEWLINE),
    to: email,
  });

  const forgotPasswordOtpRegexp = new RegExp(
    `${emailContentTemplate.replace('[SEPARATOR]', '')}\\s+${email}.\\s+(\\d{${
      OtpService.PASSWORD_LENGTH
    }})`,
  );
  const otp = otpEmail.text.match(forgotPasswordOtpRegexp)![1] ?? null;

  if (!otp) {
    throw new InternalServerErrorException(
      `Could not retrieve the forgot-password OTP for the administrator: '${email}'`,
    );
  }

  await mailhog.api.deleteMessage(otpEmail.ID);

  return otp;
}
