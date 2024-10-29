import { Test, TestingModule } from '@nestjs/testing';

import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { NotificationService } from './notification.service';

describe(NotificationService.name, () => {
  const passwordResetModuleOptions = {
    callback: {
      notifyUser: jest.fn(),
    },
  } as const;

  let notificationService: NotificationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PASSWORD_RESET_MODULE_OPTIONS_TOKEN,
          useValue: passwordResetModuleOptions,
        },
        NotificationService,
      ],
    }).compile();

    notificationService = module.get(NotificationService);
  });

  it('should be defined', () => {
    expect(notificationService).toBeDefined();
  });

  describe(NotificationService.prototype.notifyUser.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the provided callback with the provided user & password-reset instance', async () => {
      const user = Symbol('User');
      const passwordReset = Symbol('Password-Reset');

      await notificationService.notifyUser(user, passwordReset);

      expect(
        passwordResetModuleOptions.callback.notifyUser,
      ).toHaveBeenCalledTimes(1);
      expect(
        passwordResetModuleOptions.callback.notifyUser,
      ).toHaveBeenCalledWith(user, passwordReset);
    });

    it('anchors any error thrown through the callback to the current call-stack', async () => {
      const error = new Error();

      passwordResetModuleOptions.callback.notifyUser.mockImplementationOnce(
        () => {
          throw error;
        },
      );

      await expect(
        notificationService.notifyUser('user', 'password-request'),
      ).rejects.toThrow(error);
    });
  });
});
