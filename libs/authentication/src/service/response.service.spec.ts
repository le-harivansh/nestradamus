import { TestingModule, Test } from "@nestjs/testing";
import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from "../authentication.module-definition";
import { AuthenticationModuleOptions } from "../authentication.module-options";
import { ResponseService } from "./response.service";
import { TokenService } from "./token.service";
import { ObjectId } from "mongodb";
import { Response } from "express";

jest.mock('../service/token.service');

describe(ResponseService.name, () => {
  const authenticatedUser = {
    _id: new ObjectId(),
  }

  const ACCESS_TOKEN = 'test-access-token';
  const REFRESH_TOKEN = 'test-refresh-token';

  const response = { cookie: jest.fn(), clearCookie: jest.fn() } as unknown as Response;

  const authenticationModuleOptions: Pick<
    AuthenticationModuleOptions,
    'accessToken' | 'refreshToken'
  > = {
    accessToken: {
      cookieName: 'authentication.access-token',
      expiresInSeconds: 15 * 60, // 15 minutes
    },
    refreshToken: {
      cookieName: 'authentication.refresh-token',
      expiresInSeconds: 7 * 24 * 60 * 60, // 1 week
    },
  };

  let responseService: ResponseService;

  let tokenService: jest.Mocked<TokenService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        ResponseService, 

        TokenService,
      ],
    }).compile();

    responseService = module.get(ResponseService);

    tokenService = module.get(TokenService);

    // Mocks
    tokenService.createAccessTokenForUser.mockReturnValue(ACCESS_TOKEN);
    tokenService.createRefreshTokenForUser.mockReturnValue(REFRESH_TOKEN);
  });

  it('should be defined', () => {
    expect(responseService).toBeDefined();
  });

  describe(ResponseService.prototype.setAccessTokenCookieForUserInResponse.name, () => {
    beforeAll(() => {
      responseService.setAccessTokenCookieForUserInResponse(authenticatedUser, response)
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${TokenService.name}::${TokenService.prototype.createAccessTokenForUser.name}' with the authenticated user`, () => {
      expect(tokenService.createAccessTokenForUser).toHaveBeenCalledTimes(
        1,
      );
      expect(tokenService.createAccessTokenForUser).toHaveBeenCalledWith(authenticatedUser);
    });

    it(`calls '${Response.name}::cookie' with the appropriate arguments`, () => {
      expect(response.cookie).toHaveBeenCalledTimes(1);

      expect(response.cookie).toHaveBeenNthCalledWith(
        1,
        authenticationModuleOptions.accessToken.cookieName,
        ACCESS_TOKEN,
        {
          ...TokenService.COOKIE_OPTIONS,
          maxAge:
            authenticationModuleOptions.accessToken.expiresInSeconds * 1000,
        },
      );
    });
  })

  describe(ResponseService.prototype.setRefreshTokenCookieForUserInResponse.name, () => {
    beforeAll(() => {
      responseService.setRefreshTokenCookieForUserInResponse(authenticatedUser, response)
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${TokenService.name}::${TokenService.prototype.createRefreshTokenForUser.name}' with the authenticated user`, () => {
      expect(tokenService.createRefreshTokenForUser).toHaveBeenCalledTimes(
        1,
      );
      expect(tokenService.createRefreshTokenForUser).toHaveBeenCalledWith(authenticatedUser);
    });

    it(`calls '${Response.name}::cookie' with the appropriate arguments`, () => {
      expect(response.cookie).toHaveBeenCalledTimes(1);

      expect(response.cookie).toHaveBeenNthCalledWith(
        1,
        authenticationModuleOptions.refreshToken.cookieName,
        REFRESH_TOKEN,
        {
          ...TokenService.COOKIE_OPTIONS,
          maxAge:
            authenticationModuleOptions.refreshToken.expiresInSeconds * 1000,
        },
      );
    });
  })

  describe(ResponseService.prototype.clearAccessTokenCookie.name, () => {
    beforeAll(() => {
      responseService.clearAccessTokenCookie(response);
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it(`calls '${Response.name}::clearCookie' with the appropriate arguments`, () => {
      expect(response.clearCookie).toHaveBeenCalledTimes(1);

      expect(response.clearCookie).toHaveBeenNthCalledWith(
        1,
        authenticationModuleOptions.accessToken.cookieName,
        TokenService.COOKIE_OPTIONS,
      );
    });
  })

  describe(ResponseService.prototype.clearRefreshTokenCookie.name, () => {
    beforeAll(() => {
      responseService.clearRefreshTokenCookie(response);
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it(`calls '${Response.name}::clearCookie' with the appropriate arguments`, () => {
      expect(response.clearCookie).toHaveBeenCalledTimes(1);

      expect(response.clearCookie).toHaveBeenNthCalledWith(
        1,
        authenticationModuleOptions.refreshToken.cookieName,
        TokenService.COOKIE_OPTIONS,
      );
    });
  })
})
