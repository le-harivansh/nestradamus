import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import request from 'supertest';

import { Otp, OtpSchema } from '@/_library/_otp/schema/otp.schema';
import { OtpService } from '@/_library/_otp/service/otp.service';
import { RegistrationController } from '@/_user/_registration/controller/registration.controller';
import { RegistrationDto } from '@/_user/_registration/dto/registration.dto';

import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/bootstrap';
import { Mailhog } from './helper/mailhog';
import { getRegistrationOtp, registerUser } from './helper/user';

describe(`${RegistrationController.name} (e2e)`, () => {
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

  afterAll(async () => {
    await mailhog.deleteEmailsSentBetween(start, new Date());

    await teardownTestApplication({
      application,
      databaseConnection,
    });
  });

  describe('/register/send-otp (POST)', () => {
    afterEach(async () => {
      await databaseConnection.model(Otp.name, OtpSchema).deleteMany();
    });

    describe('[succeeds because]', () => {
      it('responds with HTTP:NO-CONTENT status', async () => {
        const { status } = await request(application.getHttpServer())
          .post('/register/send-otp')
          .send({ destination: 'user-1@email.com' });

        expect(status).toBe(HttpStatus.NO_CONTENT);
      });

      it('receives the email with the 6-digit OTP', async () => {
        const destination = 'user-2@email.com';
        const otpEmailTextContent = 'Your one-time pin is';
        const registrationOtpRegexp = new RegExp(
          `${otpEmailTextContent}:\\s+(\\d{${OtpService.PASSWORD_LENGTH}})`,
        );

        const otpRequestSentAt = new Date();

        await request(application.getHttpServer())
          .post('/register/send-otp')
          .send({ destination });

        const otpEmail = await mailhog.getLatestEmail({
          notBefore: otpRequestSentAt,
          contents: otpEmailTextContent,
          to: destination,
        });

        expect(otpEmail.text).toMatch(registrationOtpRegexp);
      });
    });
  });

  describe('/register (POST)', () => {
    describe('[succeeds because]', () => {
      const userData: Omit<RegistrationDto, 'otp'> & {
        otp: string | null;
      } = {
        email: 'user-3@email.com',
        password: 'P@ssw0rd',
        otp: null,
      };

      beforeEach(async () => {
        userData.otp = await getRegistrationOtp(userData.email, {
          httpServer: application.getHttpServer(),
          mailhog,
        });
      });

      afterEach(async () => {
        await databaseConnection.model(Otp.name, OtpSchema).deleteMany();

        userData.otp = null;
      });

      it("responds with HTTP:OK status & the created user's data", async () => {
        const { status, body } = await request(application.getHttpServer())
          .post('/register')
          .send(userData);

        expect(status).toBe(HttpStatus.CREATED);
        expect(body).toStrictEqual({
          id: expect.any(String),
          email: userData.email,
        });
      });
    });

    describe('[fails because]', () => {
      const existingUserData: Omit<RegistrationDto, 'otp'> = {
        email: 'user-4@email.com',
        password: 'P@ssw0rd',
      };

      const newUserData: Omit<RegistrationDto, 'otp'> & {
        otp: string | undefined;
      } = {
        email: 'user-5@email.com',
        password: 'P@ssw0rd',
        otp: undefined,
      };

      beforeAll(async () => {
        /**
         * Create `existing` user.
         */
        await registerUser(existingUserData, {
          httpServer: application.getHttpServer(),
          mailhog,
        });

        /**
         * Get `new` user's OTP.
         */
        newUserData.otp = await getRegistrationOtp(newUserData.email, {
          httpServer: application.getHttpServer(),
          mailhog,
        });
      });

      it.each<Omit<RegistrationDto, 'otp'> & { getOtp: () => string }>([
        // empty DTO
        { getOtp: () => undefined } as any,
        // all empty fields
        { email: '', password: '', getOtp: () => '' },
        // empty password field
        {
          email: newUserData.email,
          password: '',
          getOtp: () => newUserData.otp!,
        },
        // empty email field
        { email: '', password: 'P@ssw0rd', getOtp: () => newUserData.otp! },
        // no uppercase character in password
        {
          email: newUserData.email,
          password: 'p@ssw0rd',
          getOtp: () => newUserData.otp!,
        },
        // no lowercase character in password
        {
          email: newUserData.email,
          password: 'P@SSW0RD',
          getOtp: () => newUserData.otp!,
        },
        // no special character in password
        {
          email: newUserData.email,
          password: 'Passw0rd',
          getOtp: () => newUserData.otp!,
        },
        // no number in password
        {
          email: newUserData.email,
          password: 'P@ssword',
          getOtp: () => newUserData.otp!,
        },
        // email already exists
        {
          ...existingUserData,
          getOtp: () => newUserData.otp!,
        },
        // bad otp
        {
          ...newUserData,
          getOtp: () => 'bad-otp',
        },
      ])(
        "responds with HTTP:BAD_REQUEST if the provided user-data is invalid [email: '$email', password: '$password']",
        async ({ email, password, getOtp }) => {
          const { status } = await request(application.getHttpServer())
            .post('/register')
            .send({ email, password, otp: getOtp() });

          expect(status).toBe(HttpStatus.BAD_REQUEST);
        },
      );
    });
  });
});
