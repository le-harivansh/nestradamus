import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { ResponseService } from '../service/response.service';
import { TokenRefreshController } from './token-refresh.controller';

jest.mock('../service/response.service');

describe(TokenRefreshController.name, () => {
  const user = Symbol('User');
  const response = {} as Response;

  const authenticationModuleOptions: {
    route: Pick<AuthenticationModuleOptions['route'], 'tokenRefresh'>;
  } = {
    route: {
      tokenRefresh: {
        accessToken: 'refresh/access-token',
        refreshToken: 'refresh/refresh-token',
      },
    },
  };

  let tokenRefreshController: TokenRefreshController;
  let responseService: jest.Mocked<ResponseService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenRefreshController],
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        ResponseService,
      ],
    }).compile();

    tokenRefreshController = module.get(TokenRefreshController);
    responseService = module.get(ResponseService);
  });

  it('should be defined', () => {
    expect(tokenRefreshController).toBeDefined();
  });

  describe(TokenRefreshController.prototype.refreshAccessToken.name, () => {
    beforeAll(() => {
      tokenRefreshController.refreshAccessToken(user, response);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.setAccessTokenCookieForUserInResponse.name}' with the authenticated user`, () => {
      expect(
        responseService.setAccessTokenCookieForUserInResponse,
      ).toHaveBeenCalledTimes(1);
      expect(
        responseService.setAccessTokenCookieForUserInResponse,
      ).toHaveBeenCalledWith(user, response);
    });
  });

  describe(TokenRefreshController.prototype.refreshRefreshToken.name, () => {
    beforeAll(() => {
      tokenRefreshController.refreshRefreshToken(user, response);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.setRefreshTokenCookieForUserInResponse.name}' with the authenticated user`, () => {
      expect(
        responseService.setRefreshTokenCookieForUserInResponse,
      ).toHaveBeenCalledTimes(1);
      expect(
        responseService.setRefreshTokenCookieForUserInResponse,
      ).toHaveBeenCalledWith(user, response);
    });
  });
});
