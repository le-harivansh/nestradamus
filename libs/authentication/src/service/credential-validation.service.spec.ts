import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { CredentialValidationService } from './credential-validation.service';
import { UserResolverService } from './user-resolver.service';

jest.mock('../service/user-resolver.service');

describe(CredentialValidationService.name, () => {
  const passwordValidator = jest.fn().mockResolvedValue(true);
  const authenticationModuleOptions = {
    callbacks: { validatePassword: passwordValidator },
  };

  let credentialsValidationService: CredentialValidationService;
  let userResolverService: jest.Mocked<UserResolverService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        UserResolverService,
        CredentialValidationService,
      ],
    }).compile();

    credentialsValidationService = module.get(CredentialValidationService);
    userResolverService = module.get(UserResolverService);
  });

  it('should be defined', () => {
    expect(credentialsValidationService).toBeDefined();
  });

  describe(
    CredentialValidationService.prototype.validateUsernameAndPassword.name,
    () => {
      const credentials = { username: 'username', password: 'password' };
      const resolvedUser = Symbol('Resolved user');

      beforeAll(() => {
        userResolverService.resolveByUsername.mockResolvedValue(
          resolvedUser,
        );
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it(`calls '${UserResolverService.name}::${UserResolverService.prototype.resolveByUsername.name}' with the passed in 'username'`, async () => {
        await credentialsValidationService.validateUsernameAndPassword(
          credentials.username,
          credentials.password,
        );

        expect(userResolverService.resolveByUsername).toHaveBeenCalledTimes(
          1,
        );
        expect(userResolverService.resolveByUsername).toHaveBeenCalledWith(
          credentials.username,
        );
      });

      it("calls the resolved password-validator with the resolved user instance, and the passed in 'password'", async () => {
        await credentialsValidationService.validateUsernameAndPassword(
          credentials.username,
          credentials.password,
        );

        expect(passwordValidator).toHaveBeenCalledTimes(1);
        expect(passwordValidator).toHaveBeenCalledWith(
          resolvedUser,
          credentials.password,
        );
      });

      it('returns the resolved user on success', async () => {
        await expect(
          credentialsValidationService.validateUsernameAndPassword(
            credentials.username,
            credentials.password,
          ),
        ).resolves.toBe(resolvedUser);
      });

      it(`throws an '${UnauthorizedException.name}' error if the user resolves to be 'null'`, async () => {
        userResolverService.resolveByUsername.mockResolvedValueOnce(null);

        await expect(() =>
          credentialsValidationService.validateUsernameAndPassword(
            credentials.username,
            credentials.password,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });

      it(`throws an '${UnauthorizedException.name}' error if the validation fails`, async () => {
        passwordValidator.mockResolvedValueOnce(false);

        await expect(() =>
          credentialsValidationService.validateUsernameAndPassword(
            credentials.username,
            credentials.password,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });
    },
  );
});
