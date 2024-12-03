import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { Db, MongoClient } from 'mongodb';

import { DATABASE, MONGO_CLIENT } from '@library/database';

import { ConfigurationService } from '../../src/_configuration/service/configuration.service';
import { ApplicationModule } from '../../src/application.module';

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
