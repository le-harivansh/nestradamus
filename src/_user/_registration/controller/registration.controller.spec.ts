import { Test, TestingModule } from '@nestjs/testing';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/test.helper';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';

import { RegistrationDto } from '../dto/registration.dto';
import { RegistrationService } from '../service/registration.service';
import { RegistrationController } from './registration.controller';

jest.mock('../service/registration.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(RegistrationController.name, () => {
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let registrationService: jest.Mocked<RegistrationService>;
  let registrationController: RegistrationController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationController],
      providers: [WinstonLoggerService, RegistrationService],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    registrationService = module.get(RegistrationService);
    registrationController = module.get(RegistrationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(registrationController).toBeDefined();
  });

  describe('sendOtp', () => {
    const destination = 'user@email.com';

    beforeEach(async () => {
      await registrationController.sendOtp({ destination });
    });

    it('logs the registration OTP request', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Request to send user-registration OTP',
        { destination },
      );
    });

    it('calls `RegistrationService::sendOtpEmail` with the provided destination', () => {
      expect(registrationService.sendVerificationOtpEmail).toBeCalledTimes(1);
      expect(registrationService.sendVerificationOtpEmail).toBeCalledWith(
        destination,
      );
    });
  });

  describe('register', () => {
    const registrationDto: RegistrationDto = {
      email: 'user@email.com',
      password: 'P@ssw0rd',
      otp: '143576',
    };

    it('calls `RegistrationService::registerUser` with the appropriate arguments', async () => {
      await registrationController.register(registrationDto);

      expect(registrationService.registerUser).toHaveBeenCalledTimes(1);
      expect(registrationService.registerUser).toHaveBeenCalledWith(
        registrationDto.email,
        registrationDto.password,
        registrationDto.otp,
      );
    });

    it('logs the user registration requeest', async () => {
      await registrationController.register(registrationDto);

      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Request to register user',
        { email: registrationDto.email },
      );
    });

    it('returns the created user document', async () => {
      const newUser = newDocument<User>(User, UserSchema, {
        username: 'user@email.com',
        password: 'P@ssw0rd',
      });

      registrationService.registerUser.mockResolvedValueOnce(newUser);

      const newUserDocument =
        await registrationController.register(registrationDto);

      expect(newUserDocument).toBe(newUser);
    });
  });
});
