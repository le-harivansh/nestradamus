import { Test, TestingModule } from '@nestjs/testing';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';

import { TokenService } from '../_token/service/token.service';
import { AuthenticationController } from './authentication.controller';

jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('../_token/service/token.service');

describe(AuthenticationController.name, () => {
  const accessTokenData = {
    token: 'an-access-token',
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
  const refreshTokenData = {
    token: 'a-refresh-token',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  let authenticationController: AuthenticationController;
  let tokenService: jest.Mocked<TokenService>;
  let winstonLoggerService: jest.Mocked<WinstonLoggerService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [WinstonLoggerService, TokenService],
    }).compile();

    tokenService = module.get(TokenService);
    winstonLoggerService = module.get(WinstonLoggerService);
    authenticationController = module.get(AuthenticationController);

    tokenService.generateAccessTokenFor.mockReturnValue(accessTokenData);
    tokenService.generateRefreshTokenFor.mockReturnValue(refreshTokenData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authenticationController).toBeDefined();
  });

  describe('login', () => {
    const authenticatedUser = newDocument<User>(User, UserSchema, {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    });

    let result: unknown;

    beforeEach(() => {
      result = authenticationController.login(authenticatedUser);
    });

    it("calls `TokenService::generateAccessTokenFor` with the authenticated user's data", () => {
      expect(tokenService.generateAccessTokenFor).toHaveBeenCalledTimes(1);
      expect(tokenService.generateAccessTokenFor).toHaveBeenCalledWith(
        authenticatedUser,
      );
    });

    it('responds with the `access-token` & `refresh-token` data', () => {
      expect(result).toStrictEqual({
        accessToken: accessTokenData,
        refreshToken: refreshTokenData,
      });
    });

    it('calls `WinstonLoggerService::log` with the authenticated user', () => {
      expect(winstonLoggerService.log).toHaveBeenCalledTimes(1);
      expect(winstonLoggerService.log).toHaveBeenCalledWith(
        'User logged in',
        authenticatedUser,
      );
    });
  });
});
