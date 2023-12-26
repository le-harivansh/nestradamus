import { Test, TestingModule } from '@nestjs/testing';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { JwtType } from '@/_library/authentication/type';
import { newDocument } from '@/_library/test.helper';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';

import { TokenService } from '../_token/service/token.service';
import { LoginDto } from '../dto/login.dto';
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

    tokenService.generateAuthenticationJwt.mockImplementation(
      (type: JwtType) => ({
        token: type,
        expiresAt: tokenExpiresAt,
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authenticationController).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    };

    const authenticatedUser = newDocument<User>(User, UserSchema, {
      username: loginDto.email,
      password: loginDto.password,
    });

    let result: unknown;

    beforeAll(() => {
      authenticationService.authenticateUsingCredentials.mockResolvedValue(
        authenticatedUser,
      );
    });

    beforeEach(async () => {
      result = await authenticationController.login(loginDto);
    });

    it('calls `AuthenticationService::authenticateUsingCredentials` with the provided credentials from the DTO', () => {
      expect(
        authenticationService.authenticateUsingCredentials,
      ).toHaveBeenCalledTimes(1);
      expect(
        authenticationService.authenticateUsingCredentials,
      ).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });

    it("calls `TokenService::generateAuthenticationjwt` with the token type & authenticated user's data", () => {
      expect(tokenService.generateAuthenticationJwt).toHaveBeenCalledTimes(2);
      expect(tokenService.generateAuthenticationJwt).toHaveBeenCalledWith(
        'access-token',
        authenticatedUser,
      );
      expect(tokenService.generateAuthenticationJwt).toHaveBeenCalledWith(
        'refresh-token',
        authenticatedUser,
      );
    });

    it('calls `WinstonLoggerService::log` with the authenticated user', () => {
      expect(winstonLoggerService.log).toHaveBeenCalledTimes(1);
      expect(winstonLoggerService.log).toHaveBeenCalledWith(
        'User authenticated',
        authenticatedUser,
      );
    });

    it('responds with the `access-token` & `refresh-token` data', () => {
      expect(result).toStrictEqual({
        accessToken: {
          token: 'access-token',
          expiresAt: tokenExpiresAt,
        },
        refreshToken: {
          token: 'refresh-token',
          expiresAt: tokenExpiresAt,
        },
      });
    });
  });
});
