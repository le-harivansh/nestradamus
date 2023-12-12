import { Test, TestingModule } from '@nestjs/testing';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';

import { TokenService } from '../service/token.service';
import { RefreshController } from './refresh.controller';

jest.mock('@/_application/_logger/service/winston-logger.service');
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
      providers: [WinstonLoggerService, TokenService],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    tokenService = module.get(TokenService);
    refreshController = module.get(RefreshController);

    tokenService.generateAccessTokenFor.mockReturnValue(generatedTokenData);
    tokenService.generateRefreshTokenFor.mockReturnValue(generatedTokenData);
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
      serviceMethod: 'generateAccessTokenFor',
    },
    {
      controllerMethod: 'regenerateRefreshToken',
      serviceMethod: 'generateRefreshTokenFor',
    },
  ] as const)('$controllerMethod', ({ controllerMethod, serviceMethod }) => {
    const authenticatedUser = newDocument<User>(User, UserSchema, {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    });

    let response: unknown;

    beforeEach(() => {
      response = refreshController[controllerMethod](authenticatedUser);
    });

    it(`calls 'TokenService::${serviceMethod}' with the currently authenticated user`, () => {
      expect(tokenService[serviceMethod]).toHaveBeenCalledTimes(1);
      expect(tokenService[serviceMethod]).toHaveBeenCalledWith(
        authenticatedUser,
      );
    });

    it(`returns the value of 'TokenService::${serviceMethod}'`, () => {
      expect(response).toStrictEqual(generatedTokenData);
    });

    it('logs the request to generate the specified token', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        expect.stringMatching(/^Request to generate (access|refresh)-token$/),
        authenticatedUser,
      );
    });
  });
});
