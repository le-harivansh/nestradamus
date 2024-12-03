import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '../password-confirmation.module-definition';
import { CookieService } from './cookie.service';
import { ResponseService } from './response.service';

jest.mock('./cookie.service');

describe(ResponseService.name, () => {
  const PASSWORD_CONFIRMATION_HASH = 'password-confirmed';

  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  const passwordConfirmationModuleOptions = {
    cookie: {
      name: 'password-confirmation',
      expiresInSeconds: 10 * 60, // 10 minutes
    },
  };

  let responseService: ResponseService;

  let cookieService: jest.Mocked<CookieService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN,
          useValue: passwordConfirmationModuleOptions,
        },
        ResponseService,

        CookieService,
      ],
    }).compile();

    responseService = module.get(ResponseService);

    cookieService = module.get(CookieService);

    // Mocks
    cookieService.createPayload.mockResolvedValue(PASSWORD_CONFIRMATION_HASH);
  });

  it('should be defined', () => {
    expect(responseService).toBeDefined();
  });

  describe(
    ResponseService.prototype.setPasswordConfirmationCookieForUserInResponse
      .name,
    () => {
      const authenticatedUser = Symbol('Authenticated user');

      beforeAll(() => {
        responseService.setPasswordConfirmationCookieForUserInResponse(
          authenticatedUser,
          response,
        );
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

      it(`calls '${CookieService.name}::${CookieService.prototype.createPayload.name}' with the authenticated user`, () => {
        expect(cookieService.createPayload).toHaveBeenCalledTimes(1);
        expect(cookieService.createPayload).toHaveBeenCalledWith(
          authenticatedUser,
        );
      });

      it(`calls '${Response.name}::cookie' with the appropriate arguments`, () => {
        expect(response.cookie).toHaveBeenCalledTimes(1);

        expect(response.cookie).toHaveBeenCalledWith(
          passwordConfirmationModuleOptions.cookie.name,
          PASSWORD_CONFIRMATION_HASH,
          {
            ...CookieService.COOKIE_OPTIONS,
            maxAge:
              passwordConfirmationModuleOptions.cookie.expiresInSeconds * 1000,
          },
        );
      });
    },
  );

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

        expect(response.clearCookie).toHaveBeenCalledWith(
          passwordConfirmationModuleOptions.cookie.name,
          CookieService.COOKIE_OPTIONS,
        );
      });
    },
  );
});
