import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { TokenService } from '../service/token.service';
import { UserResolverService } from '../service/user-resolver.service';
import { RequiresAccessTokenMiddleware } from './requires-access-token.middleware';
import { ObjectId } from 'mongodb';

jest.mock('../service/user-resolver.service');
jest.mock('../service/token.service');

describe(RequiresAccessTokenMiddleware.name, () => {
  const REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER = 'user';
  const authenticationModuleOptions: Pick<
    AuthenticationModuleOptions,
    'requestPropertyHoldingAuthenticatedUser'
  > & {
    accessToken: Pick<AuthenticationModuleOptions['accessToken'], 'cookieName'>;
  } = {
    requestPropertyHoldingAuthenticatedUser:
      REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,
    accessToken: { cookieName: 'user.access-token' },
  };

  let accessTokenMiddleware: RequiresAccessTokenMiddleware;
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

        RequiresAccessTokenMiddleware,
      ],
    }).compile();

    accessTokenMiddleware = module.get(RequiresAccessTokenMiddleware);
    userResolverService = module.get(UserResolverService);
    tokenService = module.get(TokenService);
  });

  it('should be defined', () => {
    expect(accessTokenMiddleware).toBeDefined();
  });

  describe(RequiresAccessTokenMiddleware.prototype.use.name, () => {
    const resolvedUser = Symbol('Resolved user');
    const accessTokenPayload = { id: new ObjectId().toString() }
    const jwtStoredInCookie = 'JWT access-token';
    const request = {
      signedCookies: {
        [authenticationModuleOptions.accessToken.cookieName]: jwtStoredInCookie,
      },
    } as unknown as Request & { user: unknown };
    const response = {} as unknown as Response;
    const next = () => undefined;

    beforeAll(() => {
      userResolverService.resolveById.mockResolvedValue(resolvedUser);
      tokenService.validateAccessToken.mockReturnValue(accessTokenPayload);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${TokenService.name}::${TokenService.prototype.validateAccessToken.name}' with the access-token retrieved from the request cookie`, async () => {
      await accessTokenMiddleware.use(request, response, next);

      expect(tokenService.validateAccessToken).toHaveBeenCalledTimes(1);
      expect(tokenService.validateAccessToken).toHaveBeenCalledWith(
        request.signedCookies[
          authenticationModuleOptions.accessToken.cookieName
        ],
      );
    });

    it(`calls '${UserResolverService.name}::${UserResolverService.prototype.resolveById.name}' to retrieve the user from the database - with the "id" from the JWT`, async () => {
      await accessTokenMiddleware.use(request, response, next);

      expect(userResolverService.resolveById).toHaveBeenCalledTimes(1);
      expect(userResolverService.resolveById).toHaveBeenCalledWith(accessTokenPayload.id);
    });

    it(`adds the resolved user to the '${REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER}' property of the 'request' object`, async () => {
      await accessTokenMiddleware.use(request, response, next);

      expect(request[REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER]).toBe(
        resolvedUser,
      );
    });

    it(`throws an '${UnauthorizedException.name}' if the user resolves to be 'null'`, async () => {
      userResolverService.resolveById.mockResolvedValue(null);

      await expect(
        accessTokenMiddleware.use(request, response, next),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
