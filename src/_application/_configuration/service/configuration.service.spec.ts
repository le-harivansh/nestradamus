import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigurationService } from './configuration.service';

jest.mock('@nestjs/config');

describe('ConfigurationService', () => {
  let configurationService: ConfigurationService;
  let configService: jest.Mocked<ConfigService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, ConfigurationService],
    }).compile();

    configService = module.get(ConfigService);
    configurationService = module.get(ConfigurationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(configurationService).toBeDefined();
  });

  describe('getOrThrow', () => {
    it('calls `ConfigService::getOrThrow` with the specified key', () => {
      const key = 'application.environment';

      configurationService.getOrThrow(key);

      expect(configService.getOrThrow).toHaveBeenCalledTimes(1);
      expect(configService.getOrThrow).toHaveBeenCalledWith(key);
    });
  });
});
