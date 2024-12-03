import { Test, TestingModule } from '@nestjs/testing';

import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '../password-confirmation.module-definition';
import { CookieService } from './cookie.service';

describe(CookieService.name, () => {
  const createPayload = jest.fn();
  const validatePayload = jest.fn();

  const passwordConfirmationModuleOptions = {
    callback: {
      cookie: {
        createPayload,
        validatePayload,
      },
    },
  };

  let cookieService: CookieService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN,
          useValue: passwordConfirmationModuleOptions,
        },

        CookieService,
      ],
    }).compile();

    cookieService = module.get(CookieService);
  });

  it('should be defined', () => {
    expect(cookieService).toBeDefined();
  });

  describe(CookieService.prototype.createPayload.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the method with the passed-in user instance', async () => {
      const resolvedUser = Symbol('Resolved user');

      await cookieService.createPayload(resolvedUser);

      expect(createPayload).toHaveBeenCalledTimes(1);
      expect(createPayload).toHaveBeenCalledWith(resolvedUser);
    });

    it('returns the created cookie payload', async () => {
      const cookiePayload = 'cookie-payload';

      createPayload.mockResolvedValueOnce(cookiePayload);

      await expect(cookieService.createPayload({})).resolves.toBe(
        cookiePayload,
      );
    });
  });

  describe(CookieService.prototype.validatePayload.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the method with the passed-in user instance, and the cookie payload', async () => {
      const resolvedUser = Symbol('Resolved user');
      const cookiePayload = 'cookie-payload';

      await cookieService.validatePayload(resolvedUser, cookiePayload);

      expect(validatePayload).toHaveBeenCalledTimes(1);
      expect(validatePayload).toHaveBeenCalledWith(resolvedUser, cookiePayload);
    });

    it('returns the result of the configured callback', async () => {
      const resolvedValue = true;

      validatePayload.mockResolvedValueOnce(resolvedValue);

      await expect(
        cookieService.validatePayload({}, 'cookie-payload'),
      ).resolves.toBe(resolvedValue);
    });
  });
});
