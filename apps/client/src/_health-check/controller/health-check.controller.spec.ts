import { HealthCheckService } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseHealthIndicator } from '../health-indicator/database.health-indicator';
import { HealthCheckController } from './health-check.controller';

jest.mock('../health-indicator/database.health-indicator');

describe(HealthCheckController.name, () => {
  let healthCheckController: HealthCheckController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
      providers: [
        DatabaseHealthIndicator,
        {
          provide: HealthCheckService,
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
