import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { UserService } from '../_user/service/user.service';
import { RegisterUserDto } from './dto/registration.dto';
import { RegistrationController } from './registration.controller';

describe(RegistrationController.name, () => {
  const userData = {
    _id: new Types.ObjectId(),
    username: 'user-name',
  };
  const userService = {
    createUser: jest.fn(() => Promise.resolve(userData)),
  };

  let registrationController: RegistrationController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    registrationController = module.get(RegistrationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(registrationController).toBeDefined();
  });

  describe('register', () => {
    const registrationDto: RegisterUserDto = {
      username: 'le-user-name',
      password: 'le-pass-word',
    };

    let result: unknown;

    beforeEach(async () => {
      result = await registrationController.register(registrationDto);
    });

    it('calls `UserService::createUser` with the appropriate data', () => {
      expect(userService.createUser).toHaveBeenCalledTimes(1);
      expect(userService.createUser).toHaveBeenCalledWith(registrationDto);
    });

    it("returns the created user's data", () => {
      expect(result).toStrictEqual({
        id: userData._id.toString(),
        username: userData.username,
      });
    });
  });
});
