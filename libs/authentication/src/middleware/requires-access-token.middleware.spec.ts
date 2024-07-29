import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { AccessTokenCallbackService } from '../service/access-token-callback.service';
import { TokenService } from '../service/token.service';
import { RequiresAccessTokenMiddleware } from './requires-access-token.middleware';

jest.mock('../service/token.service');
jest.mock('../service/access-token-callback.service');

describe(RequiresAccessTokenMiddleware.name, () => {
  const REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER = 'user';
  const authenticationModuleOptions: Pick<
    AuthenticationModuleOptions,
    'requestPropertyHoldingAuthenticatedUser'
  > & {
    cookie: {
      accessToken: {
        name: AuthenticationModuleOptions['cookie']['accessToken']['name'];
      };
    };
  } = {
    requestPropertyHoldingAuthenticatedUser:
      REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER,
    cookie: { accessToken: { name: 'user.access-token' } },
  };

  let accessTokenMiddleware: RequiresAccessTokenMiddleware;
  let accessTokenCallbackService: jest.Mocked<AccessTokenCallbackService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        AccessTokenCallbackService,
        TokenService,

        RequiresAccessTokenMiddleware,
      ],
    }).compile();

    accessTokenMiddleware = module.get(RequiresAccessTokenMiddleware);
    accessTokenCallbackService = module.get(AccessTokenCallbackService);
    tokenService = module.get(TokenService);
  });

  it('should be defined', () => {
    expect(accessTokenMiddleware).toBeDefined();
  });

  describe(RequiresAccessTokenMiddleware.prototype.use.name, () => {
    const resolvedUser = Symbol('Resolved user');
    const accessTokenPayload = { id: new ObjectId().toString() };
    const jwtStoredInCookie = 'JWT access-token';
    const request = {
      signedCookies: {
        [authenticationModuleOptions.cookie.accessToken.name]:
          jwtStoredInCookie,
      },
    } as unknown as Request & { user: unknown };
    const response = {} as unknown as Response;
    const next = () => undefined;

    beforeAll(() => {
      tokenService.validateAccessToken.mockResolvedValue(accessTokenPayload);
      accessTokenCallbackService.resolveUserFromJwtPayload.mockResolvedValue(
        resolvedUser,
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${TokenService.name}::${TokenService.prototype.validateAccessToken.name}' with the access-token retrieved from the request cookie`, async () => {
      await accessTokenMiddleware.use(request, response, next);

      expect(tokenService.validateAccessToken).toHaveBeenCalledTimes(1);
      expect(tokenService.validateAccessToken).toHaveBeenCalledWith(
        request.signedCookies[
          authenticationModuleOptions.cookie.accessToken.name
        ],
      );
    });

    it(`calls '${AccessTokenCallbackService.name}::${AccessTokenCallbackService.prototype.resolveUserFromJwtPayload.name}' to retrieve the user from the database - with the JWT payload`, async () => {
      await accessTokenMiddleware.use(request, response, next);

      expect(
        accessTokenCallbackService.resolveUserFromJwtPayload,
      ).toHaveBeenCalledTimes(1);
      expect(
        accessTokenCallbackService.resolveUserFromJwtPayload,
      ).toHaveBeenCalledWith(accessTokenPayload);
    });

    it(`adds the resolved user to the '${REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER}' property of the 'request' object`, async () => {
      await accessTokenMiddleware.use(request, response, next);

      expect(request[REQUEST_PROPERTY_HOLDING_AUTHENTICATED_USER]).toBe(
        resolvedUser,
      );
    });

    it(`throws an '${UnauthorizedException.name}' if the user resolves to be 'null'`, async () => {
      accessTokenCallbackService.resolveUserFromJwtPayload.mockResolvedValue(
        null,
      );

      await expect(
        accessTokenMiddleware.use(request, response, next),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
