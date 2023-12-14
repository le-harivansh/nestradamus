import { Test, TestingModule } from '@nestjs/testing';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';

import { Type } from '../_token/constant';
import { TokenService } from '../_token/service/token.service';
import { AuthenticationService } from '../service/authentication.service';
import { AuthenticationController } from './authentication.controller';

jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('../_token/service/token.service');
jest.mock('../service/authentication.service');

describe(AuthenticationController.name, () => {
  const tokenExpiresAt = Date.now() + 15 * 60 * 1000;

  let tokenService: jest.Mocked<TokenService>;
  let winstonLoggerService: jest.Mocked<WinstonLoggerService>;
  let authenticationService: jest.Mocked<AuthenticationService>;
  let authenticationController: AuthenticationController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [WinstonLoggerService, TokenService, AuthenticationService],
    }).compile();

    tokenService = module.get(TokenService);
    winstonLoggerService = module.get(WinstonLoggerService);
    authenticationService = module.get(AuthenticationService);
    authenticationController = module.get(AuthenticationController);

    tokenService.generateAuthenticationJwt.mockImplementation((type: Type) => ({
      token: type,
      expiresAt: tokenExpiresAt,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authenticationController).toBeDefined();
  });

  describe('login', () => {
    const username = 'user@email.com';
    const password = 'P@ssw0rd';

    const authenticatedUser = newDocument<User>(User, UserSchema, {
      email: username,
      password,
    });

    let result: unknown;

    beforeAll(() => {
      authenticationService.authenticateUserUsingCredentials.mockResolvedValue(
        authenticatedUser,
      );
    });

    beforeEach(async () => {
      result = await authenticationController.login(authenticatedUser);
    });

    it("calls `TokenService::generateAuthenticationjwt` with the token type & authenticated user's data", () => {
      expect(tokenService.generateAuthenticationJwt).toHaveBeenCalledTimes(2);
      expect(tokenService.generateAuthenticationJwt).toHaveBeenCalledWith(
        Type.USER_ACCESS_TOKEN,
        authenticatedUser,
      );
      expect(tokenService.generateAuthenticationJwt).toHaveBeenCalledWith(
        Type.USER_REFRESH_TOKEN,
        authenticatedUser,
      );
    });

    it('responds with the `access-token` & `refresh-token` data', () => {
      expect(result).toStrictEqual({
        accessToken: {
          token: Type.USER_ACCESS_TOKEN,
          expiresAt: tokenExpiresAt,
        },
        refreshToken: {
          token: Type.USER_REFRESH_TOKEN,
          expiresAt: tokenExpiresAt,
        },
      });
    });

    it('calls `WinstonLoggerService::log` with the authenticated user', () => {
      expect(winstonLoggerService.log).toHaveBeenCalledTimes(1);
      expect(winstonLoggerService.log).toHaveBeenCalledWith(
        'User authenticated',
        authenticatedUser,
      );
    });
  });
});
