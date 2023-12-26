import { Test, TestingModule } from '@nestjs/testing';

import {
  Administrator,
  AdministratorSchema,
} from '@/_administration/_administrator/schema/administrator.schema';
import { AdministratorService } from '@/_administration/_administrator/service/administrator.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/test.helper';

import { TokenService } from '../service/token.service';
import { RefreshController } from './refresh.controller';

jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('@/_administration/_administrator/service/administrator.service');
jest.mock('../service/token.service');

describe(RefreshController.name, () => {
  const generatedTokenData = {
    token: 'the-generated-token',
    expiresAt: Date.now(),
  };

  let loggerService: jest.Mocked<WinstonLoggerService>;
  let tokenService: jest.Mocked<TokenService>;
  let refreshController: RefreshController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RefreshController],
      providers: [AdministratorService, WinstonLoggerService, TokenService],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    tokenService = module.get(TokenService);
    refreshController = module.get(RefreshController);

    tokenService.generateAuthenticationJwt.mockReturnValue(generatedTokenData);
    tokenService.generateAuthenticationJwt.mockReturnValue(generatedTokenData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(refreshController).toBeDefined();
  });

  describe.each([
    {
      controllerMethod: 'regenerateAccessToken',
      tokenType: 'access-token',
    },
    {
      controllerMethod: 'regenerateRefreshToken',
      tokenType: 'refresh-token',
    },
  ] as const)('$controllerMethod', ({ controllerMethod, tokenType }) => {
    const authenticatedAdministrator = newDocument<Administrator>(
      Administrator,
      AdministratorSchema,
      {
        username: 'administrator@email.com',
        password: 'P@ssw0rd',
      },
    );

    let response: unknown;

    beforeEach(() => {
      response = refreshController[controllerMethod](
        authenticatedAdministrator,
      );
    });

    it('calls `TokenService::generateAuthenticationJwt` with the appropriate arguments [type: $tokenType]', () => {
      expect(tokenService.generateAuthenticationJwt).toHaveBeenCalledTimes(1);
      expect(tokenService.generateAuthenticationJwt).toHaveBeenCalledWith(
        tokenType,
        authenticatedAdministrator,
      );
    });

    it('returns the value of `TokenService::generateAuthenticationJwt`', () => {
      expect(response).toStrictEqual(generatedTokenData);
    });

    it('logs the request to generate the specified token', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        expect.stringMatching(`Request to generate ${tokenType}`),
        authenticatedAdministrator,
      );
    });
  });
});
