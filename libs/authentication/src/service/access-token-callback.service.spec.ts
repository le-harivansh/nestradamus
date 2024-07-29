import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { AccessTokenCallbackService } from './access-token-callback.service';

describe(AccessTokenCallbackService.name, () => {
  const jwtPayload = { id: new ObjectId().toString() };
  const resolvedUser = Symbol('Resolved user');

  const createJwtPayload = jest.fn().mockResolvedValue(jwtPayload);
  const validateJwtPayload = jest.fn().mockResolvedValue(true);
  const resolveUserFromJwtPayload = jest.fn().mockResolvedValue(resolvedUser);

  const authenticationModuleOptions: {
    callback: {
      accessToken: AuthenticationModuleOptions['callback']['accessToken'];
    };
  } = {
    callback: {
      accessToken: {
        createJwtPayload,
        validateJwtPayload,
        resolveUserFromJwtPayload,
      },
    },
  };

  let accessTokenCallbackService: AccessTokenCallbackService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        AccessTokenCallbackService,
      ],
    }).compile();

    accessTokenCallbackService = module.get(AccessTokenCallbackService);
  });

  it('should be defined', () => {
    expect(accessTokenCallbackService).toBeDefined();
  });

  describe(AccessTokenCallbackService.prototype.createJwtPayload.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the method with the passed-in user instance', async () => {
      await accessTokenCallbackService.createJwtPayload(resolvedUser);

      expect(createJwtPayload).toHaveBeenCalledTimes(1);
      expect(createJwtPayload).toHaveBeenCalledWith(resolvedUser);
    });

    it('returns the created JWT payload', async () => {
      await expect(
        accessTokenCallbackService.createJwtPayload(resolvedUser),
      ).resolves.toBe(jwtPayload);
    });
  });

  describe(AccessTokenCallbackService.prototype.validateJwtPayload.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the method with the passed-in JWT payload', async () => {
      await accessTokenCallbackService.validateJwtPayload(jwtPayload);

      expect(validateJwtPayload).toHaveBeenCalledTimes(1);
      expect(validateJwtPayload).toHaveBeenCalledWith(jwtPayload);
    });

    it('returns the result of the configured callback (`true` in this case)', async () => {
      await expect(
        accessTokenCallbackService.validateJwtPayload(jwtPayload),
      ).resolves.toBe(true);
    });
  });

  describe(
    AccessTokenCallbackService.prototype.resolveUserFromJwtPayload.name,
    () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('calls the method with the passed-in JWT payload', async () => {
        await accessTokenCallbackService.resolveUserFromJwtPayload(jwtPayload);

        expect(resolveUserFromJwtPayload).toHaveBeenCalledTimes(1);
        expect(resolveUserFromJwtPayload).toHaveBeenCalledWith(jwtPayload);
      });

      it('returns the resolved user instance', async () => {
        await expect(
          accessTokenCallbackService.resolveUserFromJwtPayload(jwtPayload),
        ).resolves.toBe(resolvedUser);
      });
    },
  );
});
