import {
  BadRequestException,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { PasswordConfirmationCallbackService } from '../service/password-confirmation-callback.service';
import { RequiresPasswordConfirmation } from './requires-password-confirmation.guard';

jest.mock('../service/password-confirmation-callback.service');

function createExecutionContextWith(
  user: unknown,
  signedCookies: Record<string, string> = {},
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        signedCookies,
        user,
      }),
    }),
  } as ExecutionContext;
}

describe(RequiresPasswordConfirmation.name, () => {
  const authenticationModuleOptions: {
    cookie: {
      passwordConfirmation: {
        name: AuthenticationModuleOptions['cookie']['passwordConfirmation']['name'];
      };
    };
  } = {
    cookie: {
      passwordConfirmation: {
        name: 'password-confirmation',
      },
    },
  };

  let passwordConfirmationGuard: RequiresPasswordConfirmation;

  let passwordConfirmationCallbackService: jest.Mocked<PasswordConfirmationCallbackService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        PasswordConfirmationCallbackService,
        RequiresPasswordConfirmation,
      ],
    }).compile();

    passwordConfirmationGuard = module.get(RequiresPasswordConfirmation);
    passwordConfirmationCallbackService = module.get(
      PasswordConfirmationCallbackService,
    );
  });

  it('should be defined', () => {
    expect(passwordConfirmationGuard).toBeDefined();
  });

  describe(RequiresPasswordConfirmation.prototype.canActivate.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`throws an '${UnauthorizedException.name}' if the authenticated user could not be retrieved from the request object`, () => {
      expect(() =>
        passwordConfirmationGuard.canActivate(
          createExecutionContextWith(undefined),
        ),
      ).toThrow(UnauthorizedException);
    });

    it(`throws a '${BadRequestException.name}' if the cookie-payload could not be retrieved from the request object`, async () => {
      await expect(
        async () =>
          await passwordConfirmationGuard.canActivate(
            createExecutionContextWith({}),
          ),
      ).rejects.toThrow(BadRequestException);
    });

    it(`calls '${PasswordConfirmationCallbackService.name}::${PasswordConfirmationCallbackService.prototype.validateCookiePayload.name}' with the authenticated user and the password-confirmation cookie-payload`, async () => {
      const authenticatedUser = Symbol('Authenticated user');
      const passwordConfirmationCookiePayload =
        'password-confirmation-cookie-payload';

      await passwordConfirmationGuard.canActivate(
        createExecutionContextWith(authenticatedUser, {
          [authenticationModuleOptions.cookie.passwordConfirmation.name]:
            passwordConfirmationCookiePayload,
        }),
      );

      expect(
        passwordConfirmationCallbackService.validateCookiePayload,
      ).toHaveBeenCalledTimes(1);
      expect(
        passwordConfirmationCallbackService.validateCookiePayload,
      ).toHaveBeenCalledWith(
        authenticatedUser,
        passwordConfirmationCookiePayload,
      );
    });

    it(`returns the result of '${PasswordConfirmationCallbackService.name}::${PasswordConfirmationCallbackService.prototype.validateCookiePayload.name}'`, async () => {
      passwordConfirmationCallbackService.validateCookiePayload.mockResolvedValueOnce(
        true,
      );

      const isCookiePayloadValid = await passwordConfirmationGuard.canActivate(
        createExecutionContextWith(
          {},
          {
            [authenticationModuleOptions.cookie.passwordConfirmation.name]:
              'password-confirmation-cookie-payload',
          },
        ),
      );

      expect(isCookiePayloadValid).toBe(true);
    });
  });
});
