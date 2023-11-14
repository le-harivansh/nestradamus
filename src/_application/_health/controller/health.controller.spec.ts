import {
  DiskHealthIndicator,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { HealthController } from './health.controller';

describe(HealthController.name, () => {
  let controller: HealthController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: undefined,
        },
        {
          provide: HttpHealthIndicator,
          useValue: undefined,
        },
        {
          provide: MongooseHealthIndicator,
          useValue: undefined,
        },
        {
          provide: DiskHealthIndicator,
          useValue: undefined,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: undefined,
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
