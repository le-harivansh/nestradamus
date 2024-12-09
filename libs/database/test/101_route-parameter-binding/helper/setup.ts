import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { DatabaseModule } from '../../../src';
import { TestController } from './test.controller';

export async function setupTestApplication() {
  const databaseCredentials = {
    username: 'username',
    password: 'password',
  } as const;

  const mongoMemoryServer = await MongoMemoryServer.create({
    auth: {
      enable: true,
      customRootName: databaseCredentials.username,
      customRootPwd: databaseCredentials.password,
    },
  });

  @Module({
    imports: [
      DatabaseModule.forRoot({
        scheme: 'mongodb',
        host: mongoMemoryServer.instanceInfo!.ip,
        port: mongoMemoryServer.instanceInfo!.port,
        username: databaseCredentials.username,
        password: databaseCredentials.password,
        databaseName: 'test-database',
        applicationName: 'TestApplication',
      }),
    ],

    controllers: [TestController],

    providers: [
      {
        provide: APP_PIPE,
        useClass: ValidationPipe,
      },
    ],
  })
  class TestModule {}

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestModule],
  }).compile();

  const application = moduleFixture.createNestApplication();

  // Setup container for custom class-validators
  useContainer(application.select(TestModule), {
    fallbackOnErrors: true,
  });

  return {
    application: await application.init(),
    mongoMemoryServer,
  };
}

export async function shutDownTestApplication(
  application: INestApplication,
  mongoMemoryServer: MongoMemoryServer,
) {
  await mongoMemoryServer.stop();
  await application.close();
}
