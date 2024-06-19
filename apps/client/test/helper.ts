import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { Db, MongoClient } from 'mongodb';

import { DATABASE, MONGO_CLIENT } from '@application/database';

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

export function createUser(userData: User, application: INestApplication) {
  const userService = application.get(UserService);

  return userService.createUser(userData);
}
