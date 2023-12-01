import { Test, TestingModule } from '@nestjs/testing';
import { model } from 'mongoose';

import { MockOf } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';

import { TokenService } from '../_token/service/token.service';
import { AuthenticationController } from './authentication.controller';

describe(AuthenticationController.name, () => {
  const accessTokenData = {
    token: 'an-access-token',
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
  const refreshTokenData = {
    token: 'a-refresh-token',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const tokenService: MockOf<
    TokenService,
    'generateAccessTokenFor' | 'generateRefreshTokenFor'
  > = {
    generateAccessTokenFor: jest.fn(() => accessTokenData),
    generateRefreshTokenFor: jest.fn(() => refreshTokenData),
  };

  let authenticationController: AuthenticationController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: TokenService,
          useValue: tokenService,
        },
      ],
    }).compile();

    authenticationController = module.get(AuthenticationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authenticationController).toBeDefined();
  });

  describe('login', () => {
    const UserModel = model(User.name, UserSchema);
    const authenticatedUser = new UserModel({
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

    it("calls `TokenService::generateRefreshTokenFor` with the authenticated user's data", () => {
      expect(tokenService.generateRefreshTokenFor).toHaveBeenCalledTimes(1);
      expect(tokenService.generateRefreshTokenFor).toHaveBeenCalledWith(
        authenticatedUser,
      );
    });

    it('responds with the `access-token` & `refresh-token` data', () => {
      expect(result).toStrictEqual({
        accessToken: accessTokenData,
        refreshToken: refreshTokenData,
      });
    });
  });
});
