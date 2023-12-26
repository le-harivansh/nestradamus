import { Test, TestingModule } from '@nestjs/testing';
import { HydratedDocument } from 'mongoose';

import {
  Administrator,
  AdministratorSchema,
} from '@/_administration/_administrator/schema/administrator.schema';
import { AdministratorService } from '@/_administration/_administrator/service/administrator.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/test.helper';

import { AuthenticationService } from './authentication.service';

jest.mock('@/_administration/_administrator/service/administrator.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(AuthenticationService.name, () => {
  let administratorService: jest.Mocked<AdministratorService>;
  let authenticationService: AuthenticationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdministratorService,
        WinstonLoggerService,
        AuthenticationService,
      ],
    }).compile();

    administratorService = module.get(AdministratorService);
    authenticationService = module.get(AuthenticationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authenticationService).toBeDefined();
  });

  describe('retrieveAuthenticatableEntity', () => {
    const username = 'administrator@email.com';
    let administrator: HydratedDocument<Administrator>;

    beforeAll(() => {
      administrator = newDocument<Administrator>(
        Administrator,
        AdministratorSchema,
        {
          username,
          password: 'P@ssw0rd',
        },
      );

      administratorService.findOne.mockResolvedValue(administrator);
    });

    it('calls `AdministratorService::findOne` with the provided `username` parameter', async () => {
      await authenticationService.retrieveAuthenticatableEntity(username);

      expect(administratorService.findOne).toHaveBeenCalledTimes(1);
      expect(administratorService.findOne).toHaveBeenCalledWith({ username });
    });

    it('returns the retrieved authenticated administrator', async () => {
      await expect(
        authenticationService.retrieveAuthenticatableEntity(username),
      ).resolves.toBe(administrator);
    });
  });
});
