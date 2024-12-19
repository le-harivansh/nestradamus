import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId, WithId } from 'mongodb';

import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '@library/password-confirmation/password-confirmation.module-definition';
import { CookieService } from '@library/password-confirmation/service/cookie.service';
import { UserCallbackService } from '@library/password-confirmation/service/user-callback.service';

import { fakeUserData } from '../../../test/helper/user';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entity/user.entity';
import { UserService } from '../service/user.service';
import { AuthenticatedUserController } from './authenticated-user.controller';

jest.mock('../service/user.service');

describe(AuthenticatedUserController.name, () => {
  const authenticatedUser: WithId<User> = {
    _id: new ObjectId(),
    ...fakeUserData({ permissions: ['user:create:own'] }),
  };

  let userService: jest.Mocked<UserService>;

  let authenticatedUserController: AuthenticatedUserController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticatedUserController],
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

    authenticatedUserController = module.get(AuthenticatedUserController);

    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(authenticatedUserController).toBeDefined();
  });

  describe(AuthenticatedUserController.prototype.show.name, () => {
    it('returns the currently authenticated user', () => {
      expect(authenticatedUserController.show(authenticatedUser)).toEqual(
        authenticatedUser,
      );
    });
  });

  describe(AuthenticatedUserController.prototype.update.name, () => {
    const updatedData: UpdateUserDto = {
      firstName: 'Updated FirstName',
      lastName: 'Updated LastName',
      email: 'updated-user@email.dev',
      password: 'P@ssw0rd',
      permissions: [],
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
      await authenticatedUserController.update(authenticatedUser, updatedData);

      expect(userService.update).toHaveBeenCalledTimes(1);
      expect(userService.update).toHaveBeenCalledWith(
        authenticatedUser._id,
        updatedData,
      );
    });

    it(`returns the result of '${UserService.name}::${UserService.prototype.update.name}'`, async () => {
      const result = await authenticatedUserController.update(
        authenticatedUser,
        updatedData,
      );

      expect(result).toEqual({
        ...authenticatedUser,
        ...updatedData,
      });
    });
  });

  describe(AuthenticatedUserController.prototype.delete.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserService.name}::${UserService.prototype.delete.name}' with the authenticated user's id`, async () => {
      await authenticatedUserController.delete(authenticatedUser);

      expect(userService.delete).toHaveBeenCalledTimes(1);
      expect(userService.delete).toHaveBeenCalledWith(authenticatedUser._id);
    });
  });
});
