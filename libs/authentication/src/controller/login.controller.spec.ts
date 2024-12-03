import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { AuthenticationModuleOptions } from '../authentication.module-options';
import { LoginDto } from '../dto/login.dto';
import { HookService } from '../service/hook.service';
import { ResponseService } from '../service/response.service';
import { UserCallbackService } from '../service/user-callback.service';
import { LoginController } from './login.controller';

jest.mock('../service/user-callback.service');
jest.mock('../service/response.service');
jest.mock('../service/hook.service');

describe(LoginController.name, () => {
  const request = {} as Request;
  const response = {} as Response;

  const authenticationModuleOptions: {
    route: Pick<AuthenticationModuleOptions['route'], 'login'>;
  } = {
    route: { login: 'login' },
  };

  let loginController: LoginController;

  let userCallbackService: jest.Mocked<UserCallbackService>;
  let responseService: jest.Mocked<ResponseService>;
  let hookService: jest.Mocked<HookService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        UserCallbackService,
        ResponseService,
        HookService,
      ],
    }).compile();

    loginController = module.get(LoginController);

    userCallbackService = module.get(UserCallbackService);
    responseService = module.get(ResponseService);
    hookService = module.get(HookService);
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
      userCallbackService.retrieveUser.mockResolvedValue(authenticatedUser);
      userCallbackService.validatePassword.mockResolvedValue(true);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${UserCallbackService.name}::${UserCallbackService.prototype.retrieveUser.name}' with the username from the request - to retrieve the associated user`, async () => {
      await loginController.login(request, credentials, response);

      expect(userCallbackService.retrieveUser).toHaveBeenCalledTimes(1);
      expect(userCallbackService.retrieveUser).toHaveBeenCalledWith(
        credentials.username,
      );
    });

    it(`throws an '${UnauthorizedException.name}' if a user could not be retrieved from the provided username`, async () => {
      userCallbackService.retrieveUser.mockResolvedValueOnce(null);

      await expect(() =>
        loginController.login(request, credentials, response),
      ).rejects.toThrow(UnauthorizedException);
    });

    it(`calls '${UserCallbackService.name}::${UserCallbackService.prototype.validatePassword.name}' with the resolved user instance, and the provided password from the request`, async () => {
      await loginController.login(request, credentials, response);

      expect(userCallbackService.validatePassword).toHaveBeenCalledTimes(1);
      expect(userCallbackService.validatePassword).toHaveBeenCalledWith(
        authenticatedUser,
        credentials.password,
      );
    });

    it(`throws an '${UnauthorizedException.name}' if the provided password could not be validated against the retrieved user's`, async () => {
      userCallbackService.validatePassword.mockResolvedValueOnce(false);

      await expect(() =>
        loginController.login(request, credentials, response),
      ).rejects.toThrow(UnauthorizedException);
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.setAccessTokenCookieForUserInResponse.name}' with the authenticated user`, async () => {
      await loginController.login(request, credentials, response);

      expect(
        responseService.setAccessTokenCookieForUserInResponse,
      ).toHaveBeenCalledTimes(1);
      expect(
        responseService.setAccessTokenCookieForUserInResponse,
      ).toHaveBeenCalledWith(authenticatedUser, response);
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.setRefreshTokenCookieForUserInResponse.name}' with the authenticated user`, async () => {
      await loginController.login(request, credentials, response);

      expect(
        responseService.setRefreshTokenCookieForUserInResponse,
      ).toHaveBeenCalledTimes(1);
      expect(
        responseService.setRefreshTokenCookieForUserInResponse,
      ).toHaveBeenCalledWith(authenticatedUser, response);
    });

    it(`calls '${HookService.name}::${HookService.prototype.postLogin.name}' with the request, response, and authenticated user`, async () => {
      await loginController.login(request, credentials, response);

      expect(hookService.postLogin).toHaveBeenCalledTimes(1);
      expect(hookService.postLogin).toHaveBeenCalledWith(
        request,
        response,
        authenticatedUser,
      );
    });
  });

  describe(LoginController.prototype.logout.name, () => {
    const authenticatedUser = Symbol('Authenticated User');

    beforeAll(() => {
      loginController.logout(request, response, authenticatedUser);
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

    it(`calls '${HookService.name}::${HookService.prototype.postLogout.name}' with the request, response, and authenticated user`, () => {
      expect(hookService.postLogout).toHaveBeenCalledTimes(1);
      expect(hookService.postLogout).toHaveBeenCalledWith(
        request,
        response,
        authenticatedUser,
      );
    });
  });
});
