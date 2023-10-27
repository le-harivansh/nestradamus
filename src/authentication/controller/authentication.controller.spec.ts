import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { RequestUser } from '../../user/schema/user.schema';
import { TokenService } from '../token/token.service';
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
  const tokenService = {
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
    const authenticatedUserData: RequestUser = {
      id: new Types.ObjectId().toString(),
      username: 'user-one',
    };
    let result: unknown;

    beforeEach(() => {
      result = authenticationController.login(authenticatedUserData);
    });

    it("calls `TokenService::generateAccessTokenFor` with the authenticated user's data", () => {
      expect(tokenService.generateAccessTokenFor).toHaveBeenCalledTimes(1);
      expect(tokenService.generateAccessTokenFor).toHaveBeenCalledWith(
        authenticatedUserData,
      );
    });

    it("calls `TokenService::generateRefreshTokenFor` with the authenticated user's data", () => {
      expect(tokenService.generateRefreshTokenFor).toHaveBeenCalledTimes(1);
      expect(tokenService.generateRefreshTokenFor).toHaveBeenCalledWith(
        authenticatedUserData,
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
