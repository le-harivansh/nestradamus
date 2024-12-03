import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId, WithId } from 'mongodb';

import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '@library/password-confirmation/password-confirmation.module-definition';
import { CookieService } from '@library/password-confirmation/service/cookie.service';
import { UserCallbackService } from '@library/password-confirmation/service/user-callback.service';

import { fakeUserData } from '../../../test/helper/user';
import { UpdateGeneralUserDataDto } from '../dto/update-general-user-data.dto';
import { UpdateUserEmailDto } from '../dto/update-user-email.dto';
import { UpdateUserPasswordDto } from '../dto/update-user-password.dto';
import { User } from '../schema/user.schema';
import { UserService } from '../service/user.service';
import { UserController } from './user.controller';

jest.mock('../service/user.service');

describe(UserController.name, () => {
  const authenticatedUser: WithId<User> = {
    _id: new ObjectId(),
    ...fakeUserData({ permissions: ['user:create:own'] }),
  };

  let userService: jest.Mocked<UserService>;

  let userController: UserController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,

        // `RequiresPasswordConfirmation` guard dependencies
        {
          provide: PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN,
          useValue: undefined,
        },
        {
          provide: UserCallbackService,
          useValue: undefined,
        },
        {
          provide: CookieService,
          useValue: undefined,
        },
      ],
    }).compile();

    userController = module.get(UserController);

    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe(UserController.prototype.show.name, () => {
    it('returns the currently authenticated user without its password', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userData } = authenticatedUser;

      expect(userController.show(authenticatedUser)).toStrictEqual(userData);
    });
  });

  describe(UserController.prototype.updateGeneralData.name, () => {
    const updatedData: UpdateGeneralUserDataDto = {
      firstName: 'Updated FirstName',
    };

    beforeAll(() => {
      userService.update.mockResolvedValue({
        ...authenticatedUser,
        ...updatedData,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it(`calls '${UserService.name}::${UserService.prototype.update.name}' with the authenticated user's id & the user's updated data`, async () => {
      await userController.updateGeneralData(authenticatedUser, updatedData);

      expect(userService.update).toHaveBeenCalledTimes(1);
      expect(userService.update).toHaveBeenCalledWith(
        authenticatedUser._id,
        updatedData,
      );
    });

    it(`returns the result of '${UserService.name}::${UserService.prototype.update.name}' - without the 'password' of the user`, async () => {
      const result = await userController.updateGeneralData(
        authenticatedUser,
        updatedData,
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...authenticatedUserData } = authenticatedUser;

      expect(result).toStrictEqual({
        ...authenticatedUserData,
        ...updatedData,
      });
    });
  });

  describe(UserController.prototype.updateEmail.name, () => {
    const updatedEmail: UpdateUserEmailDto = {
      email: 'updated-user@email.dev',
    };

    beforeAll(() => {
      userService.update.mockResolvedValue({
        ...authenticatedUser,
        ...updatedEmail,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it(`calls '${UserService.name}::${UserService.prototype.update.name}' with the authenticated user's id & the user's updated email`, async () => {
      await userController.updateEmail(authenticatedUser, updatedEmail);

      expect(userService.update).toHaveBeenCalledTimes(1);
      expect(userService.update).toHaveBeenCalledWith(
        authenticatedUser._id,
        updatedEmail,
      );
    });

    it(`returns the result of '${UserService.name}::${UserService.prototype.update.name}'`, async () => {
      const result = await userController.updateEmail(
        authenticatedUser,
        updatedEmail,
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...authenticatedUserData } = authenticatedUser;

      expect(result).toStrictEqual({
        ...authenticatedUserData,
        ...updatedEmail,
      });
    });
  });

  describe(UserController.prototype.updatePassword.name, () => {
    const updatedPassword: UpdateUserPasswordDto = {
      password: 'updated-user-password',
    };

    beforeAll(() => {
      userService.update.mockResolvedValue({
        ...authenticatedUser,
        ...updatedPassword,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it(`calls '${UserService.name}::${UserService.prototype.update.name}' with the authenticated user's id & the user's updated password`, async () => {
      await userController.updatePassword(authenticatedUser, updatedPassword);

      expect(userService.update).toHaveBeenCalledTimes(1);
      expect(userService.update).toHaveBeenCalledWith(
        authenticatedUser._id,
        updatedPassword,
      );
    });

    it(`returns the result of '${UserService.name}::${UserService.prototype.update.name}'`, async () => {
      const result = await userController.updatePassword(
        authenticatedUser,
        updatedPassword,
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...authenticatedUserData } = authenticatedUser;

      expect(result).toStrictEqual({ ...authenticatedUserData });
    });
  });

  describe(UserController.prototype.delete.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserService.name}::${UserService.prototype.delete.name}' with the authenticated user's id & the user's updated password`, async () => {
      await userController.delete(authenticatedUser);

      expect(userService.delete).toHaveBeenCalledTimes(1);
      expect(userService.delete).toHaveBeenCalledWith(authenticatedUser._id);
    });
  });
});
