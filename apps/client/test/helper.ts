import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { JSDOM } from 'jsdom';
import { Db, MongoClient, ObjectId } from 'mongodb';

import { DATABASE, MONGO_CLIENT } from '@library/database';
import { MailPit } from '@library/mail/../test/helper/mailpit';

import { ConfigurationService } from '../src/_configuration/service/configuration.service';
import { User } from '../src/_user/schema/user.schema';
import { UserService } from '../src/_user/service/user.service';
import { ApplicationModule } from '../src/application.module';

export async function setupTestApplication() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [ApplicationModule],
  }).compile();

  const application = moduleFixture.createNestApplication();

  const configurationService = application.get(ConfigurationService);

  /**
   * Cookies need to be signed, since the authentication middlewares:
   * `RequiresAccessTokenMiddleware` & `RequiresRefreshTokenMiddleware`
   * look for the JSON Web Token in *SIGNED* _HTTP-only_ cookies.
   */
  application.use(
    cookieParser(configurationService.getOrThrow('application.secret')),
  );

  const mongoClient = application.get<MongoClient>(MONGO_CLIENT);
  const database = application.get<Db>(DATABASE);

  await application.init();

  return {
    application,

    mongoClient,
    database,
  };
}

export async function teardownTestApplication(
  application: INestApplication,
  mongoClient: MongoClient,
  database: Db,
) {
  await database.dropDatabase();
  await mongoClient.close();

  await application.close();
}

export function fakeUserData(defaults?: Partial<User>): User {
  const PASSWORD = 'password';

  return new User(
    defaults?.firstName ?? faker.person.firstName(),
    defaults?.lastName ?? faker.person.lastName(),
    defaults?.phoneNumber ?? faker.phone.number(),
    defaults?.email ?? faker.internet.email(),
    defaults?.password ?? PASSWORD,
    defaults?.permissions ?? [],
  );
}

export function createUser(
  userData: Partial<User>,
  application: INestApplication,
) {
  const userService = application.get(UserService);

  return userService.create(fakeUserData(userData));
}

export async function getPasswordResetId(
  mailPitClient: MailPit,
  configurationService: ConfigurationService,
) {
  const emailSnippet = (
    await mailPitClient.searchMessages(
      `before:"" after:"" subject:"Forgot your ${configurationService.getOrThrow('application.name')} password"`,
    )
  ).messages[0];

  if (emailSnippet === undefined) {
    throw new Error('Could not find the forgot-password email');
  }

  const email = await mailPitClient.getMessageById(emailSnippet.ID);
  const emailJsdom = new JSDOM(email.HTML);
  const passwordResetLink = emailJsdom.window.document.querySelector(
    '[data-test-id="password-reset-link"]',
  )?.textContent;

  if (!passwordResetLink) {
    throw new Error(
      'Could not retrieve the password-reset link from the forgot-password email',
    );
  }

  const passwordResetId = passwordResetLink.split('/').reverse()[0];

  if (!passwordResetId) {
    throw new Error(
      'The password-reset id could not be retrieved from the password-reset link',
    );
  }

  return new ObjectId(passwordResetId);
}
