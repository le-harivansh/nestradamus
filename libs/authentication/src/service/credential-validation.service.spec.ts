import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { CredentialValidationService } from './credential-validation.service';

describe(CredentialValidationService.name, () => {
  const resolvedUser = Symbol('Resolved user');
  const credentialsValidator = jest.fn().mockResolvedValue(resolvedUser);

  const authenticationModuleOptions: {
    callback: {
      validateCredentials: AuthenticationModuleOptions['callback']['validateCredentials'];
    };
  } = {
    callback: {
      validateCredentials: credentialsValidator,
    },
  };

  let credentialValidationService: CredentialValidationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        CredentialValidationService,
      ],
    }).compile();

    credentialValidationService = module.get(CredentialValidationService);
  });

  it('should be defined', () => {
    expect(credentialValidationService).toBeDefined();
  });

  describe(
    CredentialValidationService.prototype.validateCredentials.name,
    () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('calls the configured callback with the passed-in `username` & `password`', async () => {
        const [username, password] = ['username', 'password'];

        await credentialValidationService.validateCredentials(
          username,
          password,
        );

        expect(credentialsValidator).toHaveBeenCalledTimes(1);
        expect(credentialsValidator).toHaveBeenCalledWith(username, password);
      });

      it('returns the resolved authenticated-user', async () => {
        await expect(
          credentialValidationService.validateCredentials(
            'username',
            'password',
          ),
        ).resolves.toBe(resolvedUser);
      });

      it(`throws an '${UnauthorizedException.name}' if the authenticated-user resolves to 'null'`, async () => {
        credentialsValidator.mockResolvedValueOnce(null);

        await expect(
          credentialValidationService.validateCredentials(
            'username',
            'password',
          ),
        ).rejects.toThrow(UnauthorizedException);
      });
    },
  );
});
