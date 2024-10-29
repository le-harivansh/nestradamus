import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PASSWORD_RESET_MODULE_OPTIONS_TOKEN } from '../password-reset.module-definition';
import { NotificationService } from '../service/notification.service';
import { PasswordResetService } from '../service/password-reset.service';
import { UserResolverService } from '../service/user-resolver.service';
import { ForgotPasswordController } from './forgot-password.controller';

jest.mock('../service/user-resolver.service');
jest.mock('../service/password-reset.service');
jest.mock('../service/notification.service');

describe(ForgotPasswordController.name, () => {
  const passwordResetModuleOptions = {
    route: {
      forgotPassword: 'forgot-password',
    },
  };

  let forgotPasswordController: ForgotPasswordController;

  let userResolverService: jest.Mocked<UserResolverService>;
  let passwordResetService: jest.Mocked<PasswordResetService>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForgotPasswordController],
      providers: [
        {
          provide: PASSWORD_RESET_MODULE_OPTIONS_TOKEN,
          useValue: passwordResetModuleOptions,
        },
        UserResolverService,
        PasswordResetService,
        NotificationService,
      ],
    }).compile();

    forgotPasswordController = module.get(ForgotPasswordController);

    userResolverService = module.get(UserResolverService);
    passwordResetService = module.get(PasswordResetService);
    notificationService = module.get(NotificationService);
  });

  it('should be defined', () => {
    expect(forgotPasswordController).toBeDefined();
  });

  describe(ForgotPasswordController.prototype.forgotPassword.name, () => {
    const user = Symbol('User');
    const passwordReset = Symbol('Password-Reset');

    beforeAll(() => {
      userResolverService.resolveUser.mockResolvedValue(user);
      passwordResetService.create.mockResolvedValue(passwordReset);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserResolverService.name}::${UserResolverService.prototype.resolveUser.name}' with the passed-in username`, async () => {
      const username = 'user@email.dev';

      await forgotPasswordController.forgotPassword({ username });

      expect(userResolverService.resolveUser).toHaveBeenCalledTimes(1);
      expect(userResolverService.resolveUser).toHaveBeenCalledWith(username);
    });

    it(`calls '${PasswordResetService.name}::${PasswordResetService.prototype.create.name}' with the resolved user`, async () => {
      await forgotPasswordController.forgotPassword({
        username: 'user@email.dev',
      });

      expect(passwordResetService.create).toHaveBeenCalledTimes(1);
      expect(passwordResetService.create).toHaveBeenCalledWith(user);
    });

    it(`calls '${NotificationService.name}::${NotificationService.prototype.notifyUser.name}' with the resolved user & password-reset instances`, async () => {
      await forgotPasswordController.forgotPassword({
        username: 'user@email.dev',
      });

      expect(notificationService.notifyUser).toHaveBeenCalledTimes(1);
      expect(notificationService.notifyUser).toHaveBeenCalledWith(
        user,
        passwordReset,
      );
    });

    it(`returns without an error if a '${NotFoundException.name}' is thrown`, async () => {
      userResolverService.resolveUser.mockImplementationOnce(() => {
        throw new NotFoundException();
      });

      await expect(
        forgotPasswordController.forgotPassword({ username: 'user@email.dev' }),
      ).resolves.toBeUndefined();
    });

    it(`throws an '${InternalServerErrorException.name}' if any other error occurs`, async () => {
      userResolverService.resolveUser.mockImplementationOnce(() => {
        throw new Error();
      });

      await expect(
        forgotPasswordController.forgotPassword({ username: 'user@email.dev' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
