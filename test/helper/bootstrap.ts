import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import { Connection } from 'mongoose';

import { MainModule } from '@/main.module';

import { Mailhog } from './mailhog';

export async function setupTestApplication() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [MainModule],
  }).compile();

  const application =
    moduleFixture.createNestApplication<NestExpressApplication>();

  const databaseConnection = moduleFixture.get<Connection>(
    getConnectionToken(),
  );

  useContainer(application.select(MainModule), {
    fallbackOnErrors: true,
  });

  await application.init();

  /**
   * It is assumed that the mailhog service is being served from
   * the default host & port: `localhost:8025`.
   */
  const mailhog = new Mailhog();

  return {
    application,
    databaseConnection,
    mailhog,
  };
}

export async function teardownTestApplication({
  application,
  databaseConnection,
}: {
  application: INestApplication;
  databaseConnection: Connection;
}) {
  await databaseConnection.db.dropDatabase();

  await application.close();
}
