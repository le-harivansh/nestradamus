import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { RequestUser } from '../../../_user/schema/user.schema';
import { TokenService } from '../service/token.service';
import { RefreshController } from './refresh.controller';

describe(RefreshController.name, () => {
  const authenticatedUser: RequestUser = {
    id: new Types.ObjectId().toString(),
    username: 'user-1001',
  };

  const generatedTokenData = {
    token: 'the-generated-token',
    expiresAt: Date.now(),
  };
  const tokenService = {
    generateAccessTokenFor: jest.fn(() => generatedTokenData),
    generateRefreshTokenFor: jest.fn(() => generatedTokenData),
  };

  let refreshController: RefreshController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RefreshController],
      providers: [
        {
          provide: TokenService,
          useValue: tokenService,
        },
      ],
    }).compile();

    refreshController = module.get(RefreshController);
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
  ])('$controllerMethod', ({ controllerMethod, serviceMethod }) => {
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
  });
});
