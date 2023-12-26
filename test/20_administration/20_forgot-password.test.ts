import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import {
  Administrator,
  AdministratorSchema,
} from '@/_administration/_administrator/schema/administrator.schema';
import { ForgotPasswordController } from '@/_administration/_authentication/_forgot-password/controller/forgot-password.controller';
import { ResetPasswordDto } from '@/_administration/_authentication/_forgot-password/dto/reset-password.dto';
import { HOST } from '@/_administration/constant';
import { Otp, OtpSchema } from '@/_library/_otp/schema/otp.schema';
import { OtpService } from '@/_library/_otp/service/otp.service';

import {
  createAdministrator,
  getForgotPasswordOtp,
} from '../helper/administrator';
import {
  setupTestApplication,
  teardownTestApplication,
} from '../helper/bootstrap';
import { Mailhog } from '../helper/mailhog';

describe(`[Administrator] ${ForgotPasswordController.name} (e2e)`, () => {
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
    await teardownTestApplication(application, databaseConnection, {
      mailhog,
      start,
    });
  });

  describe('/forgot-password/send-otp (POST)', () => {
    const administratorData: Pick<Administrator, 'username' | 'password'> = {
      username: 'administrator@email.com',
      password: 'P@ssw0rd',
    };

    let createdAdministratorId: string | null = null;

    beforeAll(async () => {
      createdAdministratorId = (
        await createAdministrator(
          {
            username: administratorData.username,
            password: administratorData.password,
          },
          databaseConnection,
        )
      ).id;
    });

    afterAll(async () => {
      await databaseConnection
        .model(Administrator.name, AdministratorSchema)
        .findByIdAndDelete(createdAdministratorId);
    });

    describe('[succeeds because]', () => {
      it('responds with HTTP:NO-CONTENT status', async () => {
        const { status } = await request(application.getHttpServer())
          .post('/forgot-password/send-otp')
          .set('Host', HOST)
          .send({ destination: administratorData.username });

        expect(status).toBe(HttpStatus.NO_CONTENT);
      });

      it('receives the email with the 6-digit OTP', async () => {
        const emailSearchStringTemplate =
          'Hi, enter the following OTP to reset your password for the [SEPARATOR]administrator account';

        const otpRequestSentAt = new Date();

        await request(application.getHttpServer())
          .post('/forgot-password/send-otp')
          .set('Host', HOST)
          .send({ destination: administratorData.username });

        const otpEmail = await mailhog.getLatestEmail({
          notBefore: otpRequestSentAt,
          contents: emailSearchStringTemplate.replace(
            '[SEPARATOR]',
            Mailhog.NEWLINE,
          ),
          to: administratorData.username,
        });

        const forgotPasswordOtpRegexp = new RegExp(
          `${emailSearchStringTemplate.replace('[SEPARATOR]', '')}\\s+${
            administratorData.username
          }.\\s+(\\d{${OtpService.PASSWORD_LENGTH}})`,
        );

        expect(otpEmail.text).toMatch(forgotPasswordOtpRegexp);
      });
    });
  });

  describe('/forgot-password/reset-password (POST)', () => {
    const administratorData: Pick<Administrator, 'username' | 'password'> = {
      username: 'administrator@email.com',
      password: 'P@ssw0rd',
    };
    const newAdministratorPassword = 'N3w_P@55w0rD';

    let createdAdministratorId: string | null = null;

    beforeAll(async () => {
      createdAdministratorId = (
        await createAdministrator(
          {
            username: administratorData.username,
            password: administratorData.password,
          },
          databaseConnection,
        )
      ).id;
    });

    afterAll(async () => {
      await databaseConnection
        .model(Administrator.name, AdministratorSchema)
        .findByIdAndDelete(createdAdministratorId);
    });

    describe('[succeeds because]', () => {
      const resetPasswordDto: Omit<ResetPasswordDto, 'otp'> & {
        otp: string | null;
      } = {
        email: administratorData.username,
        password: newAdministratorPassword,
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
          .set('Host', HOST)
          .send(resetPasswordDto);

        expect(status).toBe(HttpStatus.OK);
      });

      it('can login with the new password', async () => {
        const { status } = await request(application.getHttpServer())
          .post('/login')
          .set('Host', HOST)
          .send({
            email: administratorData.username,
            password: newAdministratorPassword,
          });

        expect(status).toBe(HttpStatus.OK);
      });
    });

    describe('[fails because]', () => {
      let resetPasswordOtp: string | null = null;

      beforeAll(async () => {
        resetPasswordOtp = await getForgotPasswordOtp(
          administratorData.username,
          {
            httpServer: application.getHttpServer(),
            mailhog,
          },
        );
      });

      it.each<Omit<ResetPasswordDto, 'otp'> & { getOtp: () => string }>([
        // empty DTO
        { getOtp: () => undefined } as any,
        // all empty fields
        { email: '', password: '', getOtp: () => '' },
        // empty password field
        {
          email: administratorData.username,
          password: '',
          getOtp: () => resetPasswordOtp!,
        },
        // empty email field
        { email: '', password: 'P@ssw0rd', getOtp: () => resetPasswordOtp! },
        // no uppercase character in password
        {
          email: administratorData.username,
          password: 'p@ssw0rd',
          getOtp: () => resetPasswordOtp!,
        },
        // no lowercase character in password
        {
          email: administratorData.username,
          password: 'P@SSW0RD',
          getOtp: () => resetPasswordOtp!,
        },
        // no special character in password
        {
          email: administratorData.username,
          password: 'Passw0rd',
          getOtp: () => resetPasswordOtp!,
        },
        // no number in password
        {
          email: administratorData.username,
          password: 'P@ssword',
          getOtp: () => resetPasswordOtp!,
        },
        // bad otp
        {
          email: administratorData.username,
          password: 'New_P@ssw0rd-2',
          getOtp: () => 'bad-otp',
        },
      ])(
        "responds with HTTP:BAD_REQUEST if the provided user-data is invalid [email: '$email', password: '$password']",
        async ({ email, password, getOtp }) => {
          const { status } = await request(application.getHttpServer())
            .post('/forgot-password/reset-password')
            .set('Host', HOST)
            .send({ email, password, otp: getOtp() });

          expect(status).toBe(HttpStatus.BAD_REQUEST);
        },
      );
    });
  });
});
