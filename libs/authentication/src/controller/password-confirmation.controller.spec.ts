import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { ObjectId } from 'mongodb';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { PasswordValidationService } from '../service/password-validation.service';
import { ResponseService } from '../service/response.service';
import { PasswordConfirmationController } from './password-confirmation.controller';

jest.mock('../service/password-validation.service');
jest.mock('../service/response.service');

describe(PasswordConfirmationController.name, () => {
  const response = {} as Response;

  const authenticationModuleOptions: {
    requestPropertyHoldingAuthenticatedUser: AuthenticationModuleOptions['requestPropertyHoldingAuthenticatedUser'];
    route: Pick<AuthenticationModuleOptions['route'], 'passwordConfirmation'>;
  } = {
    requestPropertyHoldingAuthenticatedUser: 'user',
    route: { passwordConfirmation: 'confirm-password' },
  };

  let passwordConfirmationController: PasswordConfirmationController;

  let passwordValidationService: jest.Mocked<PasswordValidationService>;
  let responseService: jest.Mocked<ResponseService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PasswordConfirmationController],
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        PasswordValidationService,
        ResponseService,
      ],
    }).compile();

    passwordConfirmationController = module.get(PasswordConfirmationController);

    passwordValidationService = module.get(PasswordValidationService);
    responseService = module.get(ResponseService);
  });

  it('should be defined', () => {
    expect(passwordConfirmationController).toBeDefined();
  });

  describe(
    PasswordConfirmationController.prototype.confirmPassword.name,
    () => {
      const authenticatedUser = {
        _id: new ObjectId(),
        firstName: 'One',
        lastName: 'Two',
        phoneNumber: '1234 56 78 90',
        email: 'one@two.com',
        password: 'hashed-password',
      };

      const password = 'password';

      beforeAll(() => {
        passwordValidationService.validatePassword.mockResolvedValue(true);
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it(`calls '${PasswordValidationService.name}::${PasswordValidationService.prototype.validatePassword.name}' with the authenticated user, and the password from the request - to retrieve the authenticated user`, async () => {
        await passwordConfirmationController.confirmPassword(
          authenticatedUser,
          { password },
          response,
        );

        expect(
          passwordValidationService.validatePassword,
        ).toHaveBeenCalledTimes(1);
        expect(passwordValidationService.validatePassword).toHaveBeenCalledWith(
          authenticatedUser,
          password,
        );
      });

      it(`calls '${ResponseService.name}::${ResponseService.prototype.setPasswordConfirmationCookieForUserInResponse.name}' with the authenticated user, and the response`, async () => {
        await passwordConfirmationController.confirmPassword(
          authenticatedUser,
          { password },
          response,
        );

        expect(
          responseService.setPasswordConfirmationCookieForUserInResponse,
        ).toHaveBeenCalledTimes(1);
        expect(
          responseService.setPasswordConfirmationCookieForUserInResponse,
        ).toHaveBeenCalledWith(authenticatedUser, response);
      });

      it(`throws an '${UnauthorizedException.name}' if the password-validation fails`, async () => {
        passwordValidationService.validatePassword.mockResolvedValueOnce(false);

        await expect(() =>
          passwordConfirmationController.confirmPassword(
            authenticatedUser,
            { password },
            response,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });
    },
  );
});
