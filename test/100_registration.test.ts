import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import request from 'supertest';

import { Otp, OtpSchema } from '@/_library/_otp/schema/otp.schema';
import { RegistrationController } from '@/_registration/controller/registration.controller';
import { RegisterUserDto } from '@/_registration/dto/registration.dto';

import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/bootstrap';
import { Mailhog } from './helper/mailhog';
import { getRegistrationOtp, registerUser } from './helper/user';

describe(`${RegistrationController.name} (e2e)`, () => {
  const otpEmailTextContent = 'Your one-time pin is';
  const registrationOtpRegexp = new RegExp(
    `${otpEmailTextContent}:\\s+(\\d{6})`,
  );
  const start = new Date();

  let application: INestApplication;
  let databaseConnection: Connection;
  let mailhog: Mailhog;

  beforeAll(async () => {
    const {
      application: testApplication,
      databaseConnection: testDatabaseConnection,
    } = await setupTestApplication();

    application = testApplication;
    databaseConnection = testDatabaseConnection;

    /**
     * It is assumed that the mailhog service is being served from
     * the default host & port (`localhost:8025`)
     */
    mailhog = new Mailhog();
  });

  afterAll(async () => {
    await mailhog.deleteEmailsSentBetween(start, new Date());

    await teardownTestApplication({
      application,
      databaseConnection,
    });
  });

  describe('/send-otp (POST)', () => {
    afterEach(async () => {
      await Promise.all([
        databaseConnection.model(Otp.name, OtpSchema).deleteMany().exec(),
      ]);
    });

    describe('[succeeds because]', () => {
      it('responds with HTTP:NO-CONTENT status', async () => {
        const { status } = await request(application.getHttpServer())
          .post('/register/send-otp')
          .send({ destination: 'user-1@email.com' });

        expect(status).toBe(HttpStatus.NO_CONTENT);
      });

      it('receives the email with the 6-digit OTP', async () => {
        const otpRequestSentAt = new Date();
        const destination = 'user-2@email.com';

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
      const userData: Omit<RegisterUserDto, 'otp'> & {
        otp: string | null;
      } = {
        email: 'user-3@email.com',
        password: 'P@ssw0rd',
        otp: null,
      };

      let otpModel: Model<Otp>;

      beforeAll(() => {
        otpModel = databaseConnection.model(Otp.name, OtpSchema);
      });

      beforeEach(async () => {
        userData.otp = await getRegistrationOtp(userData.email, {
          httpServer: application.getHttpServer(),
          mailhog,
        });
      });

      afterEach(async () => {
        await otpModel.deleteMany();

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
      const existingUserData: Omit<RegisterUserDto, 'otp'> = {
        email: 'user-4@email.com',
        password: 'P@ssw0rd',
      };

      const newUserData: Omit<RegisterUserDto, 'otp'> & {
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

        // create `new` user.
        await registerUser(newUserData, {
          httpServer: application.getHttpServer(),
          mailhog,
        });
      });

      it.each<Omit<RegisterUserDto, 'otp'> & { otp: () => string }>([
        // all empty fields
        { email: '', password: '', otp: () => '' },
        // empty password field
        {
          email: newUserData.email,
          password: '',
          otp: () => newUserData.otp!,
        },
        // empty email field
        { email: '', password: 'P@ssw0rd', otp: () => newUserData.otp! },
        // no uppercase character in password
        {
          email: newUserData.email,
          password: 'p@ssw0rd',
          otp: () => newUserData.otp!,
        },
        // no lowercase character in password
        {
          email: newUserData.email,
          password: 'P@SSW0RD',
          otp: () => newUserData.otp!,
        },
        // no special character in password
        {
          email: newUserData.email,
          password: 'Passw0rd',
          otp: () => newUserData.otp!,
        },
        // no number in password
        {
          email: newUserData.email,
          password: 'P@ssword',
          otp: () => newUserData.otp!,
        },
        // email already exists
        {
          ...existingUserData,
          otp: () => newUserData.otp!,
        },
        // bad otp
        {
          ...newUserData,
          otp: () => 'bad-otp',
        },
      ])(
        "responds with HTTP:BAD_REQUEST if the provided user-data is invalid [email: '$email', password: '$password']",
        async ({ email, password, otp }) => {
          const { status } = await request(application.getHttpServer())
            .post('/register')
            .send({ email, password, otp: otp() });

          expect(status).toBe(HttpStatus.BAD_REQUEST);
        },
      );
    });
  });
});
