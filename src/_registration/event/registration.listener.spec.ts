import { Test, TestingModule } from '@nestjs/testing';

import { MockOf } from '@/_library/helper';
import { UserDocument } from '@/_user/schema/user.schema';

import { RegistrationService } from '../service/registration.service';
import { RegistrationListener } from './registration.listener';

describe('RegistrationListenerService', () => {
  const registrationServiceMock: MockOf<
    RegistrationService,
    'sendWelcomeEmail'
  > = {
    sendWelcomeEmail: jest.fn(),
  };

  let registrationListener: RegistrationListener;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RegistrationService,
          useValue: registrationServiceMock,
        },
        RegistrationListener,
      ],
    }).compile();

    registrationListener = module.get(RegistrationListener);
  });

  it('should be defined', () => {
    expect(registrationListener).toBeDefined();
  });

  describe('handleUserRegistration', () => {
    it('calls `RegistrationService::sendWelcomeEmail` with the newly registered `User`', async () => {
      const userData = {
        email: 'user@email.com',
      } as unknown as UserDocument;

      await registrationListener.handleUserRegistration(userData);

      expect(registrationServiceMock.sendWelcomeEmail).toHaveBeenCalledTimes(1);
      expect(registrationServiceMock.sendWelcomeEmail).toHaveBeenCalledWith(
        userData.email,
      );
    });
  });
});
