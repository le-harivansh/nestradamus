import { HealthCheckService } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { HealthCheckController } from './health-check.controller';

describe(HealthCheckController.name, () => {
  let healthCheckController: HealthCheckController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
      providers: [{ provide: HealthCheckService, useValue: null }],
    }).compile();

    healthCheckController = module.get(HealthCheckController);
  });

  it('should be defined', () => {
    expect(healthCheckController).toBeDefined();
  });
});
