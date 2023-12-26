import { Test, TestingModule } from '@nestjs/testing';
import { HydratedDocument, Types } from 'mongoose';

import {
  Administrator,
  AdministratorSchema,
} from '@/_administration/_administrator/schema/administrator.schema';
import { AdministratorService } from '@/_administration/_administrator/service/administrator.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/test.helper';

import { TokenService } from '../_token/service/token.service';
import { RequiresAdministratorRefreshToken } from './requires-administrator-refresh-token.guard';

jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('@/_administration/_administrator/service/administrator.service');
jest.mock('../_token/service/token.service');

describe(RequiresAdministratorRefreshToken.name, () => {
  let administratorService: jest.Mocked<AdministratorService>;
  let tokenService: jest.Mocked<TokenService>;
  let jwtGuard: RequiresAdministratorRefreshToken;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WinstonLoggerService,
        AdministratorService,
        TokenService,
        RequiresAdministratorRefreshToken,
      ],
    }).compile();

    administratorService = module.get(AdministratorService);
    tokenService = module.get(TokenService);
    jwtGuard = module.get(RequiresAdministratorRefreshToken);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(jwtGuard).toBeDefined();
  });

  describe('getAuthenticatableEntity', () => {
    const administrator = newDocument<Administrator>(
      Administrator,
      AdministratorSchema,
      {
        username: 'administrator@email.com',
        password: 'P@ssw0rd',
      },
    );

    beforeAll(() => {
      administratorService.findOne.mockResolvedValue(administrator);
    });

    let result: HydratedDocument<Administrator>;

    beforeEach(async () => {
      result = await jwtGuard.getAuthenticatableEntity(administrator._id);
    });

    it('calls `UserService::findOne` with the specified user-id', () => {
      expect(administratorService.findOne).toHaveBeenCalledTimes(1);
      expect(administratorService.findOne).toHaveBeenCalledWith(
        administrator._id,
      );
    });

    it('returns the result of `UserService::findOne`', () => {
      expect(result).toBe(administrator);
    });
  });

  describe('validateAuthenticationJwt', () => {
    const jwt = 'json-web-token';
    const authenticatableEntityId = new Types.ObjectId();

    beforeAll(() => {
      tokenService.validateAuthenticationJwt.mockReturnValue({
        id: authenticatableEntityId.toString(),
      });
    });

    let result: Types.ObjectId;

    beforeEach(() => {
      result = jwtGuard.validateAuthenticationJwt(jwt);
    });

    it('calls `TokenService::validateAuthenticationJwt` with the specified jwt', () => {
      expect(tokenService.validateAuthenticationJwt).toHaveBeenCalledTimes(1);
      expect(tokenService.validateAuthenticationJwt).toHaveBeenCalledWith(
        jwtGuard['type'],
        jwt,
      );
    });

    it('returns the authenticatable-entity id from `TokenService::validateAuthenticationJwt`', () => {
      expect(result).toStrictEqual(authenticatableEntityId);
    });
  });
});
