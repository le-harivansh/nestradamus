import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { Otp, OtpSchema } from '@/_library/_otp/schema/otp.schema';
import { OtpService } from '@/_library/_otp/service/otp.service';
import { ForgotPasswordController } from '@/_user/_authentication/_forgot-password/controller/forgot-password.controller';
import { ResetPasswordDto } from '@/_user/_authentication/_forgot-password/dto/reset-password.dto';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';

import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/bootstrap';
import { Mailhog } from './helper/mailhog';
import { getForgotPasswordOtp, registerUser } from './helper/user';

describe(`${ForgotPasswordController.name} (e2e)`, () => {
  let start: Date;
  let application: INestApplication;
  let databaseConnection: Connection;
  let mailhog: Mailhog;

  beforeAll(async () => {
    start = new Date();

    const {
      application: testApplication,
      databaseConnection: testDatabaseConnection,
      mailhog: testMailhog,
    } = await setupTestApplication();

    application = testApplication;
    databaseConnection = testDatabaseConnection;
    mailhog = testMailhog;
  });

  afterEach(async () => {
    await databaseConnection.model(Otp.name, OtpSchema).deleteMany();
  });

  afterAll(async () => {
    await mailhog.deleteEmailsSentBetween(start, new Date());

    await teardownTestApplication({
      application,
      databaseConnection,
    });
  });

  describe('/forgot-password/send-otp (POST)', () => {
    const userData: Pick<User, 'email' | 'password'> = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };

    let registeredUserId: string | null = null;

    beforeAll(async () => {
      registeredUserId = (
        await registerUser(userData, {
          httpServer: application.getHttpServer(),
          mailhog,
        })
      ).id;
    });

    afterAll(async () => {
      await databaseConnection
        .model(User.name, UserSchema)
        .findByIdAndDelete(registeredUserId);
    });

    describe('[succeeds because]', () => {
      it('responds with HTTP:NO-CONTENT status', async () => {
        const { status } = await request(application.getHttpServer())
          .post('/forgot-password/send-otp')
          .send({ destination: userData.email });

        expect(status).toBe(HttpStatus.NO_CONTENT);
      });

      it('receives the email with the 6-digit OTP', async () => {
        const emailContent =
          'Hi, enter the following OTP to reset your password for the account';
        const forgotPasswordOtpRegexp = new RegExp(
          `${emailContent}\\s+${userData.email}.\\s+(\\d{${OtpService.PASSWORD_LENGTH}})`,
        );

        const otpRequestSentAt = new Date();

        await request(application.getHttpServer())
          .post('/forgot-password/send-otp')
          .send({ destination: userData.email });

        const otpEmail = await mailhog.getLatestEmail({
          notBefore: otpRequestSentAt,
          contents: emailContent,
          to: userData.email,
        });

        expect(otpEmail.text).toMatch(forgotPasswordOtpRegexp);
      });
    });
  });

  describe('/forgot-password/reset-password (POST)', () => {
    const userData: Pick<User, 'email' | 'password'> = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };
    const newUserPassword = 'N3w_P@55w0rD';

    let registeredUserId: string | null = null;

    beforeAll(async () => {
      registeredUserId = (
        await registerUser(userData, {
          httpServer: application.getHttpServer(),
          mailhog,
        })
      ).id;
    });

    afterAll(async () => {
      await databaseConnection
        .model(User.name, UserSchema)
        .findByIdAndDelete(registeredUserId);
    });

    describe('[succeeds because]', () => {
      const resetPasswordDto: Omit<ResetPasswordDto, 'otp'> & {
        otp: string | null;
      } = {
        email: userData.email,
        password: newUserPassword,
        otp: null,
      };

      beforeEach(async () => {
        resetPasswordDto.otp = await getForgotPasswordOtp(
          resetPasswordDto.email,
          {
            httpServer: application.getHttpServer(),
            mailhog,
          },
        );
      });

      it('responds with HTTP:OK status', async () => {
        const { status } = await request(application.getHttpServer())
          .post('/forgot-password/reset-password')
          .send(resetPasswordDto);

        expect(status).toBe(HttpStatus.OK);
      });

      it('can login with the new password', async () => {
        const { status } = await request(application.getHttpServer())
          .post('/login')
          .send({
            email: userData.email,
            password: newUserPassword,
          });

        expect(status).toBe(HttpStatus.OK);
      });
    });

    describe('[fails because]', () => {
      let resetPasswordOtp: string | null = null;

      beforeAll(async () => {
        resetPasswordOtp = await getForgotPasswordOtp(userData.email, {
          httpServer: application.getHttpServer(),
          mailhog,
        });
      });

      it.each<Omit<ResetPasswordDto, 'otp'> & { getOtp: () => string }>([
        // empty DTO
        { getOtp: () => undefined } as any,
        // all empty fields
        { email: '', password: '', getOtp: () => '' },
        // empty password field
        {
          email: userData.email,
          password: '',
          getOtp: () => resetPasswordOtp!,
        },
        // empty email field
        { email: '', password: 'P@ssw0rd', getOtp: () => resetPasswordOtp! },
        // no uppercase character in password
        {
          email: userData.email,
          password: 'p@ssw0rd',
          getOtp: () => resetPasswordOtp!,
        },
        // no lowercase character in password
        {
          email: userData.email,
          password: 'P@SSW0RD',
          getOtp: () => resetPasswordOtp!,
        },
        // no special character in password
        {
          email: userData.email,
          password: 'Passw0rd',
          getOtp: () => resetPasswordOtp!,
        },
        // no number in password
        {
          email: userData.email,
          password: 'P@ssword',
          getOtp: () => resetPasswordOtp!,
        },
        // bad otp
        {
          email: userData.email,
          password: 'New_P@ssw0rd-2',
          getOtp: () => 'bad-otp',
        },
      ])(
        "responds with HTTP:BAD_REQUEST if the provided user-data is invalid [email: '$email', password: '$password']",
        async ({ email, password, getOtp }) => {
          const { status } = await request(application.getHttpServer())
            .post('/forgot-password/reset-password')
            .send({ email, password, otp: getOtp() });

          expect(status).toBe(HttpStatus.BAD_REQUEST);
        },
      );
    });
  });
});
