import { Test, TestingModule } from '@nestjs/testing';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/test.helper';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';

import { RegistrationService } from '../service/registration.service';
import { RegistrationListener } from './registration.listener';

jest.mock('../service/registration.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(RegistrationListener.name, () => {
  let loggerService: jest.Mocked<WinstonLoggerService>;
  let registrationService: jest.Mocked<RegistrationService>;
  let registrationListener: RegistrationListener;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WinstonLoggerService,
        RegistrationService,
        RegistrationListener,
      ],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    registrationService = module.get(RegistrationService);
    registrationListener = module.get(RegistrationListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(registrationListener).toBeDefined();
  });

  describe('handleUserRegistration', () => {
    const user = newDocument<User>(User, UserSchema, {
      username: 'user@email.com',
      password: 'P@ssw0rd',
    });

    beforeEach(async () => {
      await registrationListener.handleUserRegistration(user);
    });

    it('calls `RegistrationService::sendWelcomeEmail` with the newly registered `User`', async () => {
      expect(registrationService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
      expect(registrationService.sendWelcomeEmail).toHaveBeenCalledWith(
        user.get('username'),
      );
    });

    it('logs the user-registration event', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Handling user-registration event',
        user,
      );
    });
  });
});
