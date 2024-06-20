import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { ObjectId } from 'mongodb';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { LoginDto } from '../dto/login.dto';
import { CredentialValidationService } from '../service/credential-validation.service';
import { LoginController } from './login.controller';
import { ResponseService } from '../service/response.service';

jest.mock('../service/credential-validation.service');
jest.mock('../service/response.service');

describe(LoginController.name, () => {
  const response = {} as Response;

  const authenticationModuleOptions = {
    routes: { login: { withCredentials: 'login' } },
  };

  let loginController: LoginController;

  let credentialValidationService: jest.Mocked<CredentialValidationService>;
  let responseService: jest.Mocked<ResponseService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        CredentialValidationService,
        ResponseService,
      ],
    }).compile();

    loginController = module.get(LoginController);

    credentialValidationService = module.get(CredentialValidationService);
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
      credentialValidationService.validateUsernameAndPassword.mockResolvedValue(
        authenticatedUser,
      );
    });

    beforeAll(async () => {
      await loginController.login(credentials, response);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it(`calls '${CredentialValidationService.name}::${CredentialValidationService.prototype.validateUsernameAndPassword.name}' with the credentials from the request - to retrieve the authenticated user`, () => {
      expect(
        credentialValidationService.validateUsernameAndPassword,
      ).toHaveBeenCalledTimes(1);
      expect(
        credentialValidationService.validateUsernameAndPassword,
      ).toHaveBeenCalledWith(credentials.username, credentials.password);
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.setAccessTokenCookieForUserInResponse.name}' with the authenticated user`, () => {
      expect(responseService.setAccessTokenCookieForUserInResponse).toHaveBeenCalledTimes(1);
      expect(responseService.setAccessTokenCookieForUserInResponse).toHaveBeenCalledWith(
        authenticatedUser, response
      );
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.setRefreshTokenCookieForUserInResponse.name}' with the authenticated user`, () => {
      expect(responseService.setRefreshTokenCookieForUserInResponse).toHaveBeenCalledTimes(1);
      expect(responseService.setRefreshTokenCookieForUserInResponse).toHaveBeenCalledWith(
        authenticatedUser, response
      );
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
      expect(responseService.clearAccessTokenCookie).toHaveBeenCalledWith(response);
    });

    it(`calls '${ResponseService.name}::${ResponseService.prototype.clearRefreshTokenCookie.name}' with the authenticated user`, () => {
      expect(responseService.clearRefreshTokenCookie).toHaveBeenCalledTimes(1);
      expect(responseService.clearRefreshTokenCookie).toHaveBeenCalledWith(response);
    });
  });
});
