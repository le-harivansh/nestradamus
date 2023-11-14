import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { MockOf } from '@/_library/helper';

import { ConfigurationService } from './configuration.service';

describe('ConfigurationService', () => {
  const configService: MockOf<ConfigService, 'getOrThrow'> = {
    getOrThrow: jest.fn(),
  };

  let configurationService: ConfigurationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    configurationService = module.get(ConfigurationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(configurationService).toBeDefined();
  });

  describe('getOrThrow', () => {
    it('calls `configService::getOrThrow` with the specified key', () => {
      const key = 'application.environment';

      configurationService.getOrThrow(key);

      expect(configService.getOrThrow).toHaveBeenCalledTimes(1);
      expect(configService.getOrThrow).toHaveBeenCalledWith(key);
    });
  });
});
