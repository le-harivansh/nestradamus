import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { RefreshTokenCallbackService } from './refresh-token-callback.service';

describe(RefreshTokenCallbackService.name, () => {
  const jwtPayload = { id: new ObjectId().toString() };
  const resolvedUser = Symbol('Resolved user');

  const createJwtPayload = jest.fn().mockResolvedValue(jwtPayload);
  const validateJwtPayload = jest.fn().mockResolvedValue(true);
  const resolveUserFromJwtPayload = jest.fn().mockResolvedValue(resolvedUser);

  const authenticationModuleOptions: {
    callback: {
      refreshToken: AuthenticationModuleOptions['callback']['refreshToken'];
    };
  } = {
    callback: {
      refreshToken: {
        createJwtPayload,
        validateJwtPayload,
        resolveUserFromJwtPayload,
      },
    },
  };

  let refreshTokenCallbackService: RefreshTokenCallbackService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        RefreshTokenCallbackService,
      ],
    }).compile();

    refreshTokenCallbackService = module.get(RefreshTokenCallbackService);
  });

  it('should be defined', () => {
    expect(refreshTokenCallbackService).toBeDefined();
  });

  describe(RefreshTokenCallbackService.prototype.createJwtPayload.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the method with the passed-in user instance', async () => {
      await refreshTokenCallbackService.createJwtPayload(resolvedUser);

      expect(createJwtPayload).toHaveBeenCalledTimes(1);
      expect(createJwtPayload).toHaveBeenCalledWith(resolvedUser);
    });

    it('returns the created JWT payload', async () => {
      await expect(
        refreshTokenCallbackService.createJwtPayload(resolvedUser),
      ).resolves.toBe(jwtPayload);
    });
  });

  describe(
    RefreshTokenCallbackService.prototype.validateJwtPayload.name,
    () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('calls the method with the passed-in JWT payload', async () => {
        await refreshTokenCallbackService.validateJwtPayload(jwtPayload);

        expect(validateJwtPayload).toHaveBeenCalledTimes(1);
        expect(validateJwtPayload).toHaveBeenCalledWith(jwtPayload);
      });

      it('returns the result of the configured callback (`true` in this case)', async () => {
        await expect(
          refreshTokenCallbackService.validateJwtPayload(jwtPayload),
        ).resolves.toBe(true);
      });
    },
  );

  describe(
    RefreshTokenCallbackService.prototype.resolveUserFromJwtPayload.name,
    () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('calls the method with the passed-in JWT payload', async () => {
        await refreshTokenCallbackService.resolveUserFromJwtPayload(jwtPayload);

        expect(resolveUserFromJwtPayload).toHaveBeenCalledTimes(1);
        expect(resolveUserFromJwtPayload).toHaveBeenCalledWith(jwtPayload);
      });

      it('returns the resolved user instance', async () => {
        await expect(
          refreshTokenCallbackService.resolveUserFromJwtPayload(jwtPayload),
        ).resolves.toBe(resolvedUser);
      });
    },
  );
});
