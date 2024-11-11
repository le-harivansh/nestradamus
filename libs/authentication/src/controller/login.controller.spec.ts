import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { ObjectId } from 'mongodb';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { LoginDto } from '../dto/login.dto';
import { PasswordValidationService } from '../service/password-validation.service';
import { ResponseService } from '../service/response.service';
import { UserRetrievalService } from '../service/user-retrieval.service';
import { LoginController } from './login.controller';

jest.mock('../service/user-retrieval.service');
jest.mock('../service/password-validation.service');
jest.mock('../service/response.service');

describe(LoginController.name, () => {
  const response = {} as Response;

  const authenticationModuleOptions: {
    route: Pick<AuthenticationModuleOptions['route'], 'login'>;
  } = {
    route: { login: 'login' },
  };

  let loginController: LoginController;

  let userRetrievalService: jest.Mocked<UserRetrievalService>;
  let passwordValidationService: jest.Mocked<PasswordValidationService>;
  let responseService: jest.Mocked<ResponseService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        UserRetrievalService,
        PasswordValidationService,
        ResponseService,
      ],
    }).compile();

    loginController = module.get(LoginController);

    userRetrievalService = module.get(UserRetrievalService);
    passwordValidationService = module.get(PasswordValidationService);
    responseService = module.get(ResponseService);
  });

  it('should be defined', () => {
    expect(loginController).toBeDefined();
  });

  describe(LoginController.prototype.login.name, () => {
    const authenticatedUser = {
      _id: new ObjectId(),
      firstName: 'One',
      lastName: 'Two',
      phoneNumber: '1234 56 78 90',
      email: 'one@two.com',
      password: 'hashed-password',
    };

    const credentials: LoginDto = {
      username: 'one@two.com',
      password: 'password',
    };

    beforeAll(() => {
      userRetrievalService.retrieveUser.mockResolvedValue(authenticatedUser);
      passwordValidationService.validatePassword.mockResolvedValue(true);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserRetrievalService.name}::${UserRetrievalService.prototype.retrieveUser.name}' with the username from the request - to retrieve the associated user`, async () => {
      await loginController.login(credentials, response);

      expect(userRetrievalService.retrieveUser).toHaveBeenCalledTimes(1);
      expect(userRetrievalService.retrieveUser).toHaveBeenCalledWith(
        credentials.username,
      );
    });

    it(`throws an '${UnauthorizedException.name}' if a user could not be retrieved from the provided username`, async () => {
      userRetrievalService.retrieveUser.mockResolvedValueOnce(null);

      await expect(() =>
        loginController.login(credentials, response),
      ).rejects.toThrow(UnauthorizedException);
    });

    it(`calls '${PasswordValidationService.name}::${PasswordValidationService.prototype.validatePassword.name}' with the resolved user instance, and the provided password from the request`, async () => {
      await loginController.login(credentials, response);

      expect(passwordValidationService.validatePassword).toHaveBeenCalledTimes(
        1,
      );
      expect(passwordValidationService.validatePassword).toHaveBeenCalledWith(
        authenticatedUser,
        credentials.password,
      );
    });

    it(`throws an '${UnauthorizedException.name}' if the provided password could not be validated against the retrieved user's`, async () => {
      passwordValidationService.validatePassword.mockResolvedValueOnce(false);

      await expect(() =>
        loginController.login(credentials, response),
      ).rejects.toThrow(UnauthorizedException);
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.setAccessTokenCookieForUserInResponse.name}' with the authenticated user`, async () => {
      await loginController.login(credentials, response);

      expect(
        responseService.setAccessTokenCookieForUserInResponse,
      ).toHaveBeenCalledTimes(1);
      expect(
        responseService.setAccessTokenCookieForUserInResponse,
      ).toHaveBeenCalledWith(authenticatedUser, response);
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.setRefreshTokenCookieForUserInResponse.name}' with the authenticated user`, async () => {
      await loginController.login(credentials, response);

      expect(
        responseService.setRefreshTokenCookieForUserInResponse,
      ).toHaveBeenCalledTimes(1);
      expect(
        responseService.setRefreshTokenCookieForUserInResponse,
      ).toHaveBeenCalledWith(authenticatedUser, response);
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.setPasswordConfirmationCookieForUserInResponse.name}' with the authenticated user`, async () => {
      await loginController.login(credentials, response);

      expect(
        responseService.setPasswordConfirmationCookieForUserInResponse,
      ).toHaveBeenCalledTimes(1);
      expect(
        responseService.setPasswordConfirmationCookieForUserInResponse,
      ).toHaveBeenCalledWith(authenticatedUser, response);
    });
  });

  describe(LoginController.prototype.logout.name, () => {
    beforeAll(() => {
      loginController.logout(response);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.clearAccessTokenCookie.name}' with the authenticated user`, () => {
      expect(responseService.clearAccessTokenCookie).toHaveBeenCalledTimes(1);
      expect(responseService.clearAccessTokenCookie).toHaveBeenCalledWith(
        response,
      );
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.clearRefreshTokenCookie.name}' with the authenticated user`, () => {
      expect(responseService.clearRefreshTokenCookie).toHaveBeenCalledTimes(1);
      expect(responseService.clearRefreshTokenCookie).toHaveBeenCalledWith(
        response,
      );
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.clearPasswordConfirmationCookie.name}' with the authenticated user`, () => {
      expect(
        responseService.clearPasswordConfirmationCookie,
      ).toHaveBeenCalledTimes(1);
      expect(
        responseService.clearPasswordConfirmationCookie,
      ).toHaveBeenCalledWith(response);
    });
  });
});
