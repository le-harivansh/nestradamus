import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { RefreshTokenCallbackService } from '../service/refresh-token-callback.service';
import { TokenService } from '../service/token.service';
import { RequiresRefreshTokenMiddleware } from './requires-refresh-token.middleware';

jest.mock('../service/token.service');
jest.mock('../service/refresh-token-callback.service');

describe(RequiresRefreshTokenMiddleware.name, () => {
  const REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER = 'user';
  const authenticationModuleOptions: Pick<
    AuthenticationModuleOptions,
    'requestPropertyHoldingAuthenticatedUser'
  > & {
    cookie: {
      refreshToken: {
        name: AuthenticationModuleOptions['cookie']['refreshToken']['name'];
      };
    };
  } = {
    requestPropertyHoldingAuthenticatedUser:
      REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,
    cookie: { refreshToken: { name: 'user.refresh-token' } },
  };

  let refreshTokenMiddleware: RequiresRefreshTokenMiddleware;
  let refreshTokenCallbackService: jest.Mocked<RefreshTokenCallbackService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        RefreshTokenCallbackService,
        TokenService,

        RequiresRefreshTokenMiddleware,
      ],
    }).compile();

    refreshTokenMiddleware = module.get(RequiresRefreshTokenMiddleware);
    refreshTokenCallbackService = module.get(RefreshTokenCallbackService);
    tokenService = module.get(TokenService);
  });

  it('should be defined', () => {
    expect(refreshTokenMiddleware).toBeDefined();
  });

  describe(RequiresRefreshTokenMiddleware.prototype.use.name, () => {
    const resolvedUser = Symbol('Resolved user');
    const refreshTokenPayload = { id: new ObjectId().toString() };
    const jwtStoredInCookie = 'JWT refresh-token';
    const request = {
      signedCookies: {
        [authenticationModuleOptions.cookie.refreshToken.name]:
          jwtStoredInCookie,
      },
    } as unknown as Request & { user: unknown };
    const response = {} as unknown as Response;
    const next = () => undefined;

    beforeAll(() => {
      tokenService.validateRefreshToken.mockResolvedValue(refreshTokenPayload);
      refreshTokenCallbackService.resolveUserFromJwtPayload.mockResolvedValue(
        resolvedUser,
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${TokenService.name}::${TokenService.prototype.validateRefreshToken.name}' with the refresh-token retrieved from the request cookie`, async () => {
      await refreshTokenMiddleware.use(request, response, next);

      expect(tokenService.validateRefreshToken).toHaveBeenCalledTimes(1);
      expect(tokenService.validateRefreshToken).toHaveBeenCalledWith(
        request.signedCookies[
          authenticationModuleOptions.cookie.refreshToken.name
        ],
      );
    });

    it(`calls '${RefreshTokenCallbackService.name}::${RefreshTokenCallbackService.prototype.resolveUserFromJwtPayload.name}' to retrieve the user from the database - with the JWT payload`, async () => {
      await refreshTokenMiddleware.use(request, response, next);

      expect(
        refreshTokenCallbackService.resolveUserFromJwtPayload,
      ).toHaveBeenCalledTimes(1);
      expect(
        refreshTokenCallbackService.resolveUserFromJwtPayload,
      ).toHaveBeenCalledWith(refreshTokenPayload);
    });

    it(`adds the resolved user to the '${REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER}' property of the 'request' object`, async () => {
      await refreshTokenMiddleware.use(request, response, next);

      expect(request[REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER]).toBe(
        resolvedUser,
      );
    });

    it(`throws an '${UnauthorizedException.name}' if the user resolves to be 'null'`, async () => {
      refreshTokenCallbackService.resolveUserFromJwtPayload.mockResolvedValue(
        null,
      );

      await expect(
        refreshTokenMiddleware.use(request, response, next),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
