import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { ObjectId } from 'mongodb';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { PasswordConfirmationCallbackService } from './password-confirmation-callback.service';
import { ResponseService } from './response.service';
import { TokenService } from './token.service';

jest.mock('./password-confirmation-callback.service');
jest.mock('./token.service');

describe(ResponseService.name, () => {
  const authenticatedUser = {
    _id: new ObjectId(),
  };

  const PASSWORD_CONFIRMATION_HASH = 'password-confirmed';

  const ACCESS_TOKEN = 'test-access-token';
  const REFRESH_TOKEN = 'test-refresh-token';

  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  const authenticationModuleOptions: Pick<
    AuthenticationModuleOptions,
    'cookie'
  > = {
    cookie: {
      passwordConfirmation: {
        name: 'password-confirmation',
        expiresInSeconds: 10 * 60, // 10 minutes
      },
      accessToken: {
        name: 'access-token',
        expiresInSeconds: 15 * 60, // 15 minutes
      },
      refreshToken: {
        name: 'refresh-token',
        expiresInSeconds: 24 * 60 * 60, // 1 day
      },
    },
  };

  let responseService: ResponseService;

  let passwordConfirmationCallbackService: jest.Mocked<PasswordConfirmationCallbackService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        ResponseService,

        PasswordConfirmationCallbackService,
        TokenService,
      ],
    }).compile();

    responseService = module.get(ResponseService);

    passwordConfirmationCallbackService = module.get(
      PasswordConfirmationCallbackService,
    );
    tokenService = module.get(TokenService);

    // Mocks
    passwordConfirmationCallbackService.createCookiePayload.mockResolvedValue(
      PASSWORD_CONFIRMATION_HASH,
    );

    tokenService.createAccessToken.mockResolvedValue(ACCESS_TOKEN);
    tokenService.createRefreshToken.mockResolvedValue(REFRESH_TOKEN);
  });

  it('should be defined', () => {
    expect(responseService).toBeDefined();
  });

  describe(
    ResponseService.prototype.setAccessTokenCookieForUserInResponse.name,
    () => {
      beforeAll(() => {
        responseService.setAccessTokenCookieForUserInResponse(
          authenticatedUser,
          response,
        );
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

      it(`calls '${TokenService.name}::${TokenService.prototype.createAccessToken.name}' with the authenticated user`, () => {
        expect(tokenService.createAccessToken).toHaveBeenCalledTimes(1);
        expect(tokenService.createAccessToken).toHaveBeenCalledWith(
          authenticatedUser,
        );
      });

      it(`calls '${Response.name}::cookie' with the appropriate arguments`, () => {
        expect(response.cookie).toHaveBeenCalledTimes(1);

        expect(response.cookie).toHaveBeenNthCalledWith(
          1,
          authenticationModuleOptions.cookie.accessToken.name,
          ACCESS_TOKEN,
          {
            ...TokenService.COOKIE_OPTIONS,
            maxAge:
              authenticationModuleOptions.cookie.accessToken.expiresInSeconds *
              1000,
          },
        );
      });
    },
  );

  describe(
    ResponseService.prototype.setRefreshTokenCookieForUserInResponse.name,
    () => {
      beforeAll(() => {
        responseService.setRefreshTokenCookieForUserInResponse(
          authenticatedUser,
          response,
        );
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

      it(`calls '${TokenService.name}::${TokenService.prototype.createRefreshToken.name}' with the authenticated user`, () => {
        expect(tokenService.createRefreshToken).toHaveBeenCalledTimes(1);
        expect(tokenService.createRefreshToken).toHaveBeenCalledWith(
          authenticatedUser,
        );
      });

      it(`calls '${Response.name}::cookie' with the appropriate arguments`, () => {
        expect(response.cookie).toHaveBeenCalledTimes(1);

        expect(response.cookie).toHaveBeenNthCalledWith(
          1,
          authenticationModuleOptions.cookie.refreshToken.name,
          REFRESH_TOKEN,
          {
            ...TokenService.COOKIE_OPTIONS,
            maxAge:
              authenticationModuleOptions.cookie.refreshToken.expiresInSeconds *
              1000,
          },
        );
      });
    },
  );

  describe(
    ResponseService.prototype.setPasswordConfirmationCookieForUserInResponse
      .name,
    () => {
      beforeAll(() => {
        responseService.setPasswordConfirmationCookieForUserInResponse(
          authenticatedUser,
          response,
        );
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

      it(`calls '${PasswordConfirmationCallbackService.name}::${PasswordConfirmationCallbackService.prototype.createCookiePayload.name}' with the authenticated user`, () => {
        expect(
          passwordConfirmationCallbackService.createCookiePayload,
        ).toHaveBeenCalledTimes(1);
        expect(
          passwordConfirmationCallbackService.createCookiePayload,
        ).toHaveBeenCalledWith(authenticatedUser);
      });

      it(`calls '${Response.name}::cookie' with the appropriate arguments`, () => {
        expect(response.cookie).toHaveBeenCalledTimes(1);

        expect(response.cookie).toHaveBeenNthCalledWith(
          1,
          authenticationModuleOptions.cookie.passwordConfirmation.name,
          PASSWORD_CONFIRMATION_HASH,
          {
            ...TokenService.COOKIE_OPTIONS,
            maxAge:
              authenticationModuleOptions.cookie.passwordConfirmation
                .expiresInSeconds * 1000,
          },
        );
      });
    },
  );

  describe(ResponseService.prototype.clearAccessTokenCookie.name, () => {
    beforeAll(() => {
      responseService.clearAccessTokenCookie(response);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${Response.name}::clearCookie' with the appropriate arguments`, () => {
      expect(response.clearCookie).toHaveBeenCalledTimes(1);

      expect(response.clearCookie).toHaveBeenNthCalledWith(
        1,
        authenticationModuleOptions.cookie.accessToken.name,
        TokenService.COOKIE_OPTIONS,
      );
    });
  });

  describe(ResponseService.prototype.clearRefreshTokenCookie.name, () => {
    beforeAll(() => {
      responseService.clearRefreshTokenCookie(response);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${Response.name}::clearCookie' with the appropriate arguments`, () => {
      expect(response.clearCookie).toHaveBeenCalledTimes(1);

      expect(response.clearCookie).toHaveBeenNthCalledWith(
        1,
        authenticationModuleOptions.cookie.refreshToken.name,
        TokenService.COOKIE_OPTIONS,
      );
    });
  });

  describe(
    ResponseService.prototype.clearPasswordConfirmationCookie.name,
    () => {
      beforeAll(() => {
        responseService.clearPasswordConfirmationCookie(response);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

      it(`calls '${Response.name}::clearCookie' with the appropriate arguments`, () => {
        expect(response.clearCookie).toHaveBeenCalledTimes(1);

        expect(response.clearCookie).toHaveBeenNthCalledWith(
          1,
          authenticationModuleOptions.cookie.passwordConfirmation.name,
          TokenService.COOKIE_OPTIONS,
        );
      });
    },
  );
});
