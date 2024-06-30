import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { TokenService } from '../service/token.service';
import { UserResolverService } from '../service/user-resolver.service';
import { RequiresRefreshTokenMiddleware } from './requires-refresh-token.middleware';
import { ObjectId } from 'mongodb';

jest.mock('../service/user-resolver.service');
jest.mock('../service/token.service');

describe(RequiresRefreshTokenMiddleware.name, () => {
  const REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER = 'user';
  const authenticationModuleOptions: Pick<
    AuthenticationModuleOptions,
    'requestPropertyHoldingAuthenticatedUser'
  > & {
    refreshToken: Pick<
      AuthenticationModuleOptions['accessToken'],
      'cookieName'
    >;
  } = {
    requestPropertyHoldingAuthenticatedUser:
      REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,
    refreshToken: { cookieName: 'user.refresh-token' },
  };

  let refreshTokenMiddleware: RequiresRefreshTokenMiddleware;
  let userResolverService: jest.Mocked<UserResolverService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        UserResolverService,
        TokenService,

        RequiresRefreshTokenMiddleware,
      ],
    }).compile();

    refreshTokenMiddleware = module.get(RequiresRefreshTokenMiddleware);
    userResolverService = module.get(UserResolverService);
    tokenService = module.get(TokenService);
  });

  it('should be defined', () => {
    expect(refreshTokenMiddleware).toBeDefined();
  });

  describe(RequiresRefreshTokenMiddleware.prototype.use.name, () => {
    const resolvedUser = Symbol('Resolved user');
    const refreshTokenPayload = { id: new ObjectId().toString() }
    const jwtStoredInCookie = 'JWT refresh-token';
    const request = {
      signedCookies: {
        [authenticationModuleOptions.refreshToken.cookieName]:
          jwtStoredInCookie,
      },
    } as unknown as Request & { user: unknown };
    const response = {} as unknown as Response;
    const next = () => undefined;

    beforeAll(() => {
      userResolverService.resolveById.mockResolvedValue(resolvedUser);
      tokenService.validateRefreshToken.mockReturnValue(refreshTokenPayload);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${TokenService.name}::${TokenService.prototype.validateRefreshToken.name}' with the refresh-token retrieved from the request cookie`, async () => {
      await refreshTokenMiddleware.use(request, response, next);

      expect(tokenService.validateRefreshToken).toHaveBeenCalledTimes(1);
      expect(tokenService.validateRefreshToken).toHaveBeenCalledWith(
        request.signedCookies[
          authenticationModuleOptions.refreshToken.cookieName
        ],
      );
    });

    it(`calls '${UserResolverService.name}::${UserResolverService.prototype.resolveById.name}' to retrieve the user from the database - with the provided "id" from the JWT`, async () => {
      await refreshTokenMiddleware.use(request, response, next);

      expect(userResolverService.resolveById).toHaveBeenCalledTimes(1);
      expect(userResolverService.resolveById).toHaveBeenCalledWith(
        refreshTokenPayload.id,
      );
    });

    it(`adds the resolved user to the '${REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER}' property of the 'request' object`, async () => {
      await refreshTokenMiddleware.use(request, response, next);

      expect(request.user).toBe(resolvedUser);
    });

    it(`throws an '${UnauthorizedException.name}' if the user resolves to be 'null'`, async () => {
      userResolverService.resolveById.mockResolvedValue(null);

      await expect(
        refreshTokenMiddleware.use(request, response, next),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
