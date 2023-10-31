import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import { Connection } from 'mongoose';

import { MainModule } from '../src/main.module';

export async function setupTestApplication() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [MainModule],
  }).compile();

  const application = moduleFixture.createNestApplication();

  const databaseConnection = moduleFixture.get<Connection>(
    getConnectionToken(),
  );

  useContainer(application.select(MainModule), {
    fallbackOnErrors: true,
  });

  await application.init();

  return {
    application,
    databaseConnection,
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
