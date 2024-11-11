import { Test, TestingModule } from '@nestjs/testing';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { PasswordConfirmationCallbackService } from './password-confirmation-callback.service';

describe(PasswordConfirmationCallbackService.name, () => {
  const createCookiePayload = jest.fn();
  const validateCookiePayload = jest.fn();

  const authenticationModuleOptions: {
    callback: {
      passwordConfirmation: AuthenticationModuleOptions['callback']['passwordConfirmation'];
    };
  } = {
    callback: {
      passwordConfirmation: {
        createCookiePayload,
        validateCookiePayload,
      },
    },
  };

  let passwordConfirmationCallbackService: PasswordConfirmationCallbackService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        PasswordConfirmationCallbackService,
      ],
    }).compile();

    passwordConfirmationCallbackService = module.get(
      PasswordConfirmationCallbackService,
    );
  });

  it('should be defined', () => {
    expect(passwordConfirmationCallbackService).toBeDefined();
  });

  describe(
    PasswordConfirmationCallbackService.prototype.createCookiePayload.name,
    () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('calls the method with the passed-in user instance', async () => {
        const resolvedUser = Symbol('Resolved user');

        await passwordConfirmationCallbackService.createCookiePayload(
          resolvedUser,
        );

        expect(createCookiePayload).toHaveBeenCalledTimes(1);
        expect(createCookiePayload).toHaveBeenCalledWith(resolvedUser);
      });

      it('returns the created cookie payload', async () => {
        const cookiePayload = 'cookie-payload';

        createCookiePayload.mockResolvedValueOnce(cookiePayload);

        await expect(
          passwordConfirmationCallbackService.createCookiePayload({}),
        ).resolves.toBe(cookiePayload);
      });
    },
  );

  describe(
    PasswordConfirmationCallbackService.prototype.validateCookiePayload.name,
    () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('calls the method with the passed-in user instance, and the cookie payload', async () => {
        const resolvedUser = Symbol('Resolved user');
        const cookiePayload = 'cookie-payload';

        await passwordConfirmationCallbackService.validateCookiePayload(
          resolvedUser,
          cookiePayload,
        );

        expect(validateCookiePayload).toHaveBeenCalledTimes(1);
        expect(validateCookiePayload).toHaveBeenCalledWith(
          resolvedUser,
          cookiePayload,
        );
      });

      it('returns the result of the configured callback (`true` in this case)', async () => {
        validateCookiePayload.mockResolvedValueOnce(true);

        await expect(
          passwordConfirmationCallbackService.validateCookiePayload(
            {},
            'cookie-payload',
          ),
        ).resolves.toBe(true);
      });
    },
  );
});
