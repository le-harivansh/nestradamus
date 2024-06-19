import { TestingModule, Test } from "@nestjs/testing";
import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from "../authentication.module-definition";
import { AuthenticationModuleOptions } from "../authentication.module-options";
import { ResponseService } from "./response.service";
import { TokenService } from "./token.service";
import { UserIdExtractorService } from "./user-id-extractor.service";
import { ObjectId } from "mongodb";
import { Response } from "express";

jest.mock('../service/user-id-extractor.service');
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

  let userIdExtractorService: jest.Mocked<UserIdExtractorService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        ResponseService, 

        UserIdExtractorService,
        TokenService,
      ],
    }).compile();

    responseService = module.get(ResponseService);

    userIdExtractorService = module.get(UserIdExtractorService);
    tokenService = module.get(TokenService);

    // Mocks

    userIdExtractorService.extractId.mockReturnValue(
      authenticatedUser._id.toString(),
    );

    tokenService.createAccessTokenForUserWithId.mockReturnValue(ACCESS_TOKEN);
    tokenService.createRefreshTokenForUserWithId.mockReturnValue(REFRESH_TOKEN);
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

    it(`calls '${UserIdExtractorService.name}::${UserIdExtractorService.prototype.extractId.name}' with the authenticated user`, () => {
      expect(userIdExtractorService.extractId).toHaveBeenCalledTimes(1);
      expect(userIdExtractorService.extractId).toHaveBeenCalledWith(
        authenticatedUser,
      );
    });

    it(`calls '${TokenService.name}::${TokenService.prototype.createAccessTokenForUserWithId.name}' with the authenticated user's id`, () => {
      expect(tokenService.createAccessTokenForUserWithId).toHaveBeenCalledTimes(
        1,
      );
      expect(tokenService.createAccessTokenForUserWithId).toHaveBeenCalledWith(
        authenticatedUser._id.toString(),
      );
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

    it(`calls '${UserIdExtractorService.name}::${UserIdExtractorService.prototype.extractId.name}' with the authenticated user`, () => {
      expect(userIdExtractorService.extractId).toHaveBeenCalledTimes(1);
      expect(userIdExtractorService.extractId).toHaveBeenCalledWith(
        authenticatedUser,
      );
    });

    it(`calls '${TokenService.name}::${TokenService.prototype.createRefreshTokenForUserWithId.name}' with the authenticated user's id`, () => {
      expect(tokenService.createRefreshTokenForUserWithId).toHaveBeenCalledTimes(
        1,
      );
      expect(tokenService.createRefreshTokenForUserWithId).toHaveBeenCalledWith(
        authenticatedUser._id.toString(),
      );
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
