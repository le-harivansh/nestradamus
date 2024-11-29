import { HealthCheckService } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { DATABASE } from '@library/database';

import { MongoDbHealthIndicator } from '../health-indicator/mongo-db.health-indicator';
import { HealthCheckController } from './health-check.controller';

jest.mock('../health-indicator/mongo-db.health-indicator');

describe(HealthCheckController.name, () => {
  let healthCheckController: HealthCheckController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
      providers: [
        MongoDbHealthIndicator,
        {
          provide: HealthCheckService,
          useValue: null,
        },
        {
          provide: DATABASE,
          useValue: null,
        },
      ],
    }).compile();

    healthCheckController = module.get(HealthCheckController);
  });

  it('should be defined', () => {
    expect(healthCheckController).toBeDefined();
  });
});
