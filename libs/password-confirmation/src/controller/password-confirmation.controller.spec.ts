import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';

import { PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN } from '../password-confirmation.module-definition';
import { ResponseService } from '../service/response.service';
import { UserCallbackService } from '../service/user-callback.service';
import { PasswordConfirmationController } from './password-confirmation.controller';

jest.mock('../service/user-callback.service');
jest.mock('../service/response.service');

describe(PasswordConfirmationController.name, () => {
  const passwordConfirmationModuleOptions = {
    route: 'confirm-password',
  };

  let passwordConfirmationController: PasswordConfirmationController;

  let userCallbackService: jest.Mocked<UserCallbackService>;
  let responseService: jest.Mocked<ResponseService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PasswordConfirmationController],
      providers: [
        {
          provide: PASSWORD_CONFIRMATION_MODULE_OPTIONS_TOKEN,
          useValue: passwordConfirmationModuleOptions,
        },
        UserCallbackService,
        ResponseService,
      ],
    }).compile();

    passwordConfirmationController = module.get(PasswordConfirmationController);

    userCallbackService = module.get(UserCallbackService);
    responseService = module.get(ResponseService);
  });

  it('should be defined', () => {
    expect(passwordConfirmationController).toBeDefined();
  });

  describe(
    PasswordConfirmationController.prototype.confirmPassword.name,
    () => {
      const request = {} as unknown as Request;
      const response = {} as Response;

      const authenticatedUser = {
        email: 'user@email.dev',
        password: 'hashed-password',
      };
      const password = 'password';

      beforeAll(() => {
        userCallbackService.retrieveFrom.mockReturnValue(authenticatedUser);
        userCallbackService.validatePassword.mockResolvedValue(true);
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it(`calls '${UserCallbackService.name}::${UserCallbackService.prototype.retrieveFrom.name}' with the current request`, async () => {
        await passwordConfirmationController.confirmPassword(
          request,
          { password },
          response,
        );

        expect(userCallbackService.retrieveFrom).toHaveBeenCalledTimes(1);
        expect(userCallbackService.retrieveFrom).toHaveBeenCalledWith(request);
      });

      it(`throws an '${UnauthorizedException.name}' if the currently authenticated user could not be retrieved`, async () => {
        userCallbackService.retrieveFrom.mockReturnValueOnce(undefined);

        await expect(() =>
          passwordConfirmationController.confirmPassword(
            request,
            { password },
            response,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });

      it(`calls '${UserCallbackService.name}::${UserCallbackService.prototype.validatePassword.name}' with the authenticated user, and passed-in password`, async () => {
        await passwordConfirmationController.confirmPassword(
          request,
          { password },
          response,
        );

        expect(userCallbackService.validatePassword).toHaveBeenCalledTimes(1);
        expect(userCallbackService.validatePassword).toHaveBeenCalledWith(
          authenticatedUser,
          password,
        );
      });

      it(`throws an '${UnauthorizedException.name}' if the password-validation fails`, async () => {
        userCallbackService.validatePassword.mockResolvedValueOnce(false);

        await expect(() =>
          passwordConfirmationController.confirmPassword(
            request,
            { password },
            response,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });

      it(`calls '${ResponseService.name}::${ResponseService.prototype.setPasswordConfirmationCookieForUserInResponse.name}' with the authenticated user, and the response`, async () => {
        await passwordConfirmationController.confirmPassword(
          request,
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
    },
  );
});
