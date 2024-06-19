import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { FlattenedPrefixedConfiguration } from '../helper';
import { ConfigurationService } from './configuration.service';

jest.mock('@nestjs/config');

type NamespacedConfiguration = FlattenedPrefixedConfiguration<
  'application',
  {
    environment: 'development';
  }
>;

/**
 * (test) Configuration Service that inherits the 'Base' configuration service.
 */
@Injectable()
class TestConfigurationService extends ConfigurationService<NamespacedConfiguration> {
  constructor(configService: ConfigService) {
    super(configService);
  }
}

describe(ConfigurationService.name, () => {
  let configurationService: ConfigurationService<NamespacedConfiguration>;
  let configService: jest.Mocked<ConfigService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, TestConfigurationService],
    }).compile();

    configService = module.get(ConfigService);
    configurationService = module.get(TestConfigurationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(configurationService).toBeDefined();
  });

  describe(ConfigurationService.prototype.getOrThrow.name, () => {
    const configurationKey = 'application.environment';

    it(`calls '${ConfigurationService.name}::${ConfigurationService.prototype.getOrThrow.name}' with the specified key`, () => {
      configurationService.getOrThrow(configurationKey);

      expect(configService.getOrThrow).toHaveBeenCalledTimes(1);
      expect(configService.getOrThrow).toHaveBeenCalledWith(configurationKey);
    });
  });
});
