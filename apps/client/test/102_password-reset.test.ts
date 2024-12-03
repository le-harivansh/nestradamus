import { HttpStatus, INestApplication } from '@nestjs/common';
import { Db, MongoClient, ObjectId, WithId } from 'mongodb';
import request, { Response } from 'supertest';

import { MAILPIT_API_PORT } from '@library/mail/../test/helper/constant';
import { MailPit } from '@library/mail/../test/helper/mailpit';
import { ForgotPasswordDto } from '@library/password-reset/dto/forgot-password.dto';
import { ResetPasswordDto } from '@library/password-reset/dto/reset-password.dto';

import { LOGIN_ROUTE } from '../src/_authentication/constant';
import { ConfigurationService } from '../src/_configuration/service/configuration.service';
import {
  FORGOT_PASSWORD_ROUTE,
  RESET_PASSWORD_ROUTE,
} from '../src/_password-reset/constant';
import { PasswordReset } from '../src/_password-reset/schema/password-reset.schema';
import { User } from '../src/_user/schema/user.schema';
import {
  setupTestApplication,
  teardownTestApplication,
} from './helper/application';
import { getPasswordResetId } from './helper/mail';
import { createUser, fakeUserData } from './helper/user';

describe('Password-Reset (e2e)', () => {
  let application: INestApplication;

  let mongoClient: MongoClient;
  let database: Db;
  let mailPitClient: MailPit;

  let configurationService: ConfigurationService;

  let user: WithId<Omit<User, 'password'>>;

  const userCredentials = {
    username: 'user@email.dev',
    password: 'P@ssw0rd',
  };

  beforeAll(async () => {
    const testApplication = await setupTestApplication();

    ({ application, mongoClient, database } = testApplication);

    configurationService = application.get(ConfigurationService);

    mailPitClient = new MailPit(
      `http://${configurationService.getOrThrow('mail.host')}:${MAILPIT_API_PORT}`,
    );

    // Create user
    user = await createUser(
      fakeUserData({
        email: userCredentials.username,
        password: userCredentials.password,
      }),
      application,
    );
  });

  afterAll(async () => {
    await teardownTestApplication(application, mongoClient, database);
  });

  describe(`POST /${FORGOT_PASSWORD_ROUTE}`, () => {
    describe('[success case]', () => {
      describe('- if user exists', () => {
        let start: Date;
        let response: Response;

        beforeAll(async () => {
          start = new Date();
          response = await request(application.getHttpServer())
            .post(`/${FORGOT_PASSWORD_ROUTE}`)
            .send({ username: userCredentials.username });
        });

        afterAll(async () => {
          const end = new Date();

          await mailPitClient.deleteMessagesBetween(start, end);
        });

        it(`returns 'HTTP ${HttpStatus.NO_CONTENT}'`, () => {
          expect(response.status).toBe(HttpStatus.NO_CONTENT);
        });

        it(`sends an email with the newly generated '${PasswordReset.name}' id`, async () => {
          const passwordResetId = await getPasswordResetId(
            mailPitClient,
            configurationService,
          );

          expect(ObjectId.isValid(passwordResetId)).toBe(true);
        });
      });

      describe('- if user does not exist', () => {
        let start: Date;
        let response: Response;

        beforeAll(async () => {
          start = new Date();
          response = await request(application.getHttpServer())
            .post(`/${FORGOT_PASSWORD_ROUTE}`)
            .send({ username: 'non-existant-user@email.dev' });
        });

        afterAll(async () => {
          const end = new Date();

          await mailPitClient.deleteMessagesBetween(start, end);
        });

        it(`returns 'HTTP ${HttpStatus.NO_CONTENT}'`, () => {
          expect(response.status).toBe(HttpStatus.NO_CONTENT);
        });

        it(`does not send any email`, async () => {
          const matchedEmailsCount = (
            await mailPitClient.searchMessages(
              `before:"" after:"" subject:"Forgot your ${configurationService.getOrThrow('application.name')} password"`,
            )
          ).messages_count;

          expect(matchedEmailsCount).toBe(0);
        });
      });
    });

    describe('[failure case]', () => {
      it.each<Partial<ForgotPasswordDto>>([
        {}, // empty object
        { username: '' }, // empty string
      ])(
        `returns 'HTTP ${HttpStatus.BAD_REQUEST}' if an invalid username is sent`,
        async (forgotPasswordDto) => {
          const response = await request(application.getHttpServer())
            .post(`/${FORGOT_PASSWORD_ROUTE}`)
            .send(forgotPasswordDto);

          expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        },
      );
    });
  });

  describe(`GET /${RESET_PASSWORD_ROUTE}`, () => {
    describe('[succeeds because]', () => {
      let start: Date;
      let response: Response;
      let passwordResetId: ObjectId;

      beforeAll(async () => {
        start = new Date();

        await request(application.getHttpServer())
          .post(`/${FORGOT_PASSWORD_ROUTE}`)
          .send({ username: userCredentials.username });

        passwordResetId = await getPasswordResetId(
          mailPitClient,
          configurationService,
        );

        response = await request(application.getHttpServer()).get(
          `/${RESET_PASSWORD_ROUTE}`.replace(':id', passwordResetId.toString()),
        );
      });

      afterAll(async () => {
        const end = new Date();

        await mailPitClient.deleteMessagesBetween(start, end);
      });

      it(`returns 'HTTP ${HttpStatus.OK}' when a valid '${PasswordReset.name}' id is provided`, () => {
        expect(response.status).toBe(HttpStatus.OK);
      });

      it("returns returns the associated user's data", () => {
        expect(response.body).toEqual({
          _id: passwordResetId.toString(),
          createdAt: expect.anything(),
          user: {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
        });

        expect(Date.parse(response.body['createdAt'])).not.toBeNaN();
      });
    });

    describe('[fails because]', () => {
      it(`returns 'HTTP ${HttpStatus.NOT_FOUND}' when an invalid '${PasswordReset.name}' id is provided`, async () => {
        const response = await request(application.getHttpServer()).get(
          `/${RESET_PASSWORD_ROUTE}`.replace(':id', new ObjectId().toString()),
        );

        expect(response.status).toBe(HttpStatus.NOT_FOUND);
      });
    });
  });

  describe(`POST /${RESET_PASSWORD_ROUTE}`, () => {
    describe('[succeeds because]', () => {
      let start: Date;
      let response: Response;
      let passwordResetId: ObjectId;

      const newPassword = 'new-P@ssw0rd';

      beforeAll(async () => {
        start = new Date();

        await request(application.getHttpServer())
          .post(`/${FORGOT_PASSWORD_ROUTE}`)
          .send({ username: userCredentials.username });

        passwordResetId = await getPasswordResetId(
          mailPitClient,
          configurationService,
        );

        response = await request(application.getHttpServer())
          .post(
            `/${RESET_PASSWORD_ROUTE}`.replace(
              ':id',
              passwordResetId.toString(),
            ),
          )
          .send({ newPassword });
      });

      afterAll(async () => {
        const end = new Date();

        await mailPitClient.deleteMessagesBetween(start, end);
      });

      it(`returns 'HTTP ${HttpStatus.NO_CONTENT}' when a valid '${PasswordReset.name}' id & password is provided`, () => {
        expect(response.status).toBe(HttpStatus.NO_CONTENT);
      });

      it('allows the user to login with their new password', async () => {
        const loginResponse = await request(application.getHttpServer())
          .post(`/${LOGIN_ROUTE}`)
          .send({
            ...userCredentials,
            password: newPassword,
          });

        expect(loginResponse.status).toBe(HttpStatus.NO_CONTENT);
      });

      it(`deletes the associated '${PasswordReset.name}'`, async () => {
        const passwordResetResponse = await request(
          application.getHttpServer(),
        ).get(
          `/${RESET_PASSWORD_ROUTE}`.replace(':id', passwordResetId.toString()),
        );

        expect(passwordResetResponse.status).toBe(HttpStatus.NOT_FOUND);
      });
    });

    describe('[fails because]', () => {
      let start: Date;
      let passwordResetId: ObjectId;

      beforeAll(async () => {
        start = new Date();

        await request(application.getHttpServer())
          .post(`/${FORGOT_PASSWORD_ROUTE}`)
          .send({ username: userCredentials.username });

        passwordResetId = await getPasswordResetId(
          mailPitClient,
          configurationService,
        );
      });

      afterAll(async () => {
        const end = new Date();

        await mailPitClient.deleteMessagesBetween(start, end);
      });

      it(`returns 'HTTP ${HttpStatus.NOT_FOUND}' when an invalid '${PasswordReset.name}' id is provided`, async () => {
        const response = await request(application.getHttpServer())
          .post(
            `/${RESET_PASSWORD_ROUTE}`.replace(
              ':id',
              new ObjectId().toString(),
            ),
          )
          .send({ newPassword: 'P@ssw0rd_2' });

        expect(response.status).toBe(HttpStatus.NOT_FOUND);
      });

      it.each<Partial<ResetPasswordDto>>([
        {}, // empty password
        { newPassword: '' }, // empty string
        { newPassword: 'P@s5' }, // less than min-length
        { newPassword: 'p@ssw0rd' }, // no uppercase
        { newPassword: 'P@SSW0RD' }, // no lowercase
        { newPassword: 'P@ssword' }, // no numbers
        { newPassword: 'Passw0rd' }, // no special characters
      ])(
        `returns 'HTTP ${HttpStatus.BAD_REQUEST}' when an invalid password is provided '{newPassword: "$newPassword"}'`,
        async ({ newPassword }) => {
          const response = await request(application.getHttpServer())
            .post(
              `/${RESET_PASSWORD_ROUTE}`.replace(
                ':id',
                passwordResetId.toString(),
              ),
            )
            .send({ newPassword });

          expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        },
      );
    });
  });
});
