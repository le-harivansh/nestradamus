import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { MockOf, ModelWithId } from '@/_library/helper';
import { User } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { RegisterUserDto } from '../dto/registration.dto';
import { RegistrationController } from './registration.controller';

describe(RegistrationController.name, () => {
  const password = 'P@ssw0rd';
  const userData: Pick<ModelWithId<User>, '_id' | 'email'> = {
    _id: new Types.ObjectId(),
    email: 'user@email.com',
  };
  const userService: MockOf<UserService, 'create'> = {
    create: jest.fn(() => Promise.resolve(userData)),
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
      email: userData.email,
      password,
    };

    let result: unknown;

    beforeEach(async () => {
      result = await registrationController.register(registrationDto);
    });

    it('calls `UserService::createUser` with the appropriate data', () => {
      expect(userService.create).toHaveBeenCalledTimes(1);
      expect(userService.create).toHaveBeenCalledWith(registrationDto);
    });

    it("returns the created user's data", () => {
      expect(result).toStrictEqual({
        id: userData._id.toString(),
        email: userData.email,
      });
    });
  });
});
