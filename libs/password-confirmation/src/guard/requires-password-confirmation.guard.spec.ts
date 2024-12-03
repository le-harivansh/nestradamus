import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '../password-confirmation.module-definition';
import { CookieService } from '../service/cookie.service';
import { UserCallbackService } from '../service/user-callback.service';
import { RequiresPasswordConfirmation } from './requires-password-confirmation.guard';

jest.mock('../service/cookie.service');
jest.mock('../service/user-callback.service');

function contextWith(request: Request) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe(RequiresPasswordConfirmation.name, () => {
  const user = Symbol('Authenticated user');

  const passwordConfirmationCookieName = 'password-confirmation';
  const passwordConfirmationModuleOptions = {
    cookie: {
      name: passwordConfirmationCookieName,
    },
  };

  let requiresPasswordConfirmationGuard: RequiresPasswordConfirmation;

  let userCallbackService: jest.Mocked<UserCallbackService>;
  let cookieService: jest.Mocked<CookieService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN,
          useValue: passwordConfirmationModuleOptions,
        },
        UserCallbackService,
        CookieService,

        RequiresPasswordConfirmation,
      ],
    }).compile();

    requiresPasswordConfirmationGuard = module.get(
      RequiresPasswordConfirmation,
    );

    userCallbackService = module.get(UserCallbackService);
    cookieService = module.get(CookieService);

    // Mocks
    userCallbackService.retrieveFrom.mockReturnValue(user);
    cookieService.validatePayload.mockResolvedValue(true);
  });

  it('should be defined', () => {
    expect(requiresPasswordConfirmationGuard).toBeDefined();
  });

  describe(RequiresPasswordConfirmation.prototype.canActivate.name, () => {
    const request = {
      signedCookies: {
        [passwordConfirmationCookieName]: 'password-confirmation-cookie',
      },
    } as unknown as Request;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserCallbackService.name}::${UserCallbackService.prototype.retrieveFrom.name}' with the current request`, async () => {
      await requiresPasswordConfirmationGuard.canActivate(contextWith(request));

      expect(userCallbackService.retrieveFrom).toHaveBeenCalledTimes(1);
      expect(userCallbackService.retrieveFrom).toHaveBeenCalledWith(request);
    });

    it(`throws an '${UnauthorizedException.name}' if the authenticated user could not be retrieved from the request object`, () => {
      userCallbackService.retrieveFrom.mockReturnValueOnce(undefined);

      expect(() =>
        requiresPasswordConfirmationGuard.canActivate(contextWith(request)),
      ).toThrow(UnauthorizedException);
    });

    it(`throws an '${UnauthorizedException.name}' if the cookie-payload could not be retrieved from the request object`, async () => {
      await expect(
        async () =>
          await requiresPasswordConfirmationGuard.canActivate(
            contextWith({ signedCookies: {} } as unknown as Request),
          ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it.each([{ resolvedValue: true }, { resolvedValue: false }])(
      `returns the result of '${CookieService.name}::${CookieService.prototype.validatePayload.name}' { resolvedValue: $resolvedValue }`,
      async ({ resolvedValue }) => {
        cookieService.validatePayload.mockResolvedValueOnce(resolvedValue);

        await expect(
          requiresPasswordConfirmationGuard.canActivate(contextWith(request)),
        ).resolves.toBe(resolvedValue);
      },
    );
  });
});
