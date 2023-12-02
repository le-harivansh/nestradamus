import { Test, TestingModule } from '@nestjs/testing';
import { Types, model } from 'mongoose';

import { MockOf } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';

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

  const registrationServiceMock: MockOf<
    RegistrationService,
    'verifyOtp' | 'registerUser' | 'sendEmailVerificationOtpEmail'
  > = {
    verifyOtp: jest.fn(
      (otp: string, email: string) =>
        otp === validOtp && email === newUser.get('email'),
    ),
    registerUser: jest.fn().mockResolvedValue(newUser),
    sendEmailVerificationOtpEmail: jest.fn(),
  };

  let registrationController: RegistrationController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationController],
      providers: [
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

      expect(
        registrationServiceMock.sendEmailVerificationOtpEmail,
      ).toBeCalledTimes(1);
      expect(
        registrationServiceMock.sendEmailVerificationOtpEmail,
      ).toBeCalledWith(destination);
    });
  });

  describe('register', () => {
    const registrationDto: RegisterUserDto = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
      otp: validOtp,
    };

    it('calls `RegistrationService::registerUser` with the appropriate arguments', async () => {
      await registrationController.register(registrationDto);

      expect(registrationServiceMock.registerUser).toHaveBeenCalledTimes(1);
      expect(registrationServiceMock.registerUser).toHaveBeenCalledWith(
        registrationDto.email,
        registrationDto.password,
        registrationDto.otp,
      );
    });

    it('returns the created user document', async () => {
      const newUserDocument =
        await registrationController.register(registrationDto);

      expect(newUserDocument).toBe(newUser);
    });
  });
});
