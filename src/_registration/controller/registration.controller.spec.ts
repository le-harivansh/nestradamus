import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types, model } from 'mongoose';

import { MockOf } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';
import { UserService } from '@/_user/service/user.service';

import { RegisterUserDto } from '../dto/registration.dto';
import { RegistrationService } from '../service/registration.service';
import { RegistrationController } from './registration.controller';

describe(RegistrationController.name, () => {
  const UserModel = model(User.name, UserSchema);
  const newUser = new UserModel({
    _id: new Types.ObjectId(),
    email: 'user@email.com',
    password: 'P@ssw0rd',
  });
  const validOtp = '123456';

  const userServiceMock: MockOf<UserService, 'create'> = {
    create: jest.fn(() => Promise.resolve(newUser)),
  };

  const registrationServiceMock: MockOf<
    RegistrationService,
    'sendOtpEmail' | 'verifyOtp'
  > = {
    sendOtpEmail: jest.fn(),
    verifyOtp: jest.fn(
      (otp: string, email: string) =>
        otp === validOtp && email === newUser.get('email'),
    ),
  };

  let registrationController: RegistrationController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationController],
      providers: [
        {
          provide: UserService,
          useValue: userServiceMock,
        },
        {
          provide: RegistrationService,
          useValue: registrationServiceMock,
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

  describe('sendOtp', () => {
    it('calls `RegistrationService::sendOtpEmail` with the provided destination', async () => {
      const destination = 'user@email.com';

      await registrationController.sendOtp({ destination });

      expect(registrationServiceMock.sendOtpEmail).toBeCalledTimes(1);
      expect(registrationServiceMock.sendOtpEmail).toBeCalledWith(destination);
    });
  });

  describe('register', () => {
    const registrationDto: RegisterUserDto = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
      otp: validOtp,
    };

    it('calls `UserService::createUser` with the appropriate data', async () => {
      await registrationController.register(registrationDto);

      expect(userServiceMock.create).toHaveBeenCalledTimes(1);
      expect(userServiceMock.create).toHaveBeenCalledWith(
        registrationDto.email,
        registrationDto.password,
      );
    });

    it('throws a `BadRequestException` if the provided OTP is invalid', async () => {
      expect(
        async () =>
          await registrationController.register({
            ...registrationDto,
            otp: '000000',
          }),
      ).rejects.toThrow(BadRequestException);
    });

    it("returns the created user's data", async () => {
      const result = await registrationController.register(registrationDto);

      expect(result).toBe(newUser);
    });
  });
});
