import { Test, TestingModule } from '@nestjs/testing';
import { HydratedDocument, Types } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/test.helper';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';
import { UserService } from '@/_user/_user/service/user.service';

import { TokenService } from '../_token/service/token.service';
import { RequiresUserAccessToken } from './requires-user-access-token.guard';

jest.mock('@/_application/_logger/service/winston-logger.service');
jest.mock('@/_user/_user/service/user.service');
jest.mock('../_token/service/token.service');

describe(RequiresUserAccessToken.name, () => {
  let userService: jest.Mocked<UserService>;
  let tokenService: jest.Mocked<TokenService>;
  let jwtGuard: RequiresUserAccessToken;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WinstonLoggerService,
        UserService,
        TokenService,
        RequiresUserAccessToken,
      ],
    }).compile();

    userService = module.get(UserService);
    tokenService = module.get(TokenService);
    jwtGuard = module.get(RequiresUserAccessToken);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(jwtGuard).toBeDefined();
  });

  describe('getAuthenticatableEntity', () => {
    const user = newDocument<User>(User, UserSchema, {
      username: 'user@email.com',
      password: 'P@ssw0rd',
    });

    beforeAll(() => {
      userService.findOne.mockResolvedValue(user);
    });

    let result: HydratedDocument<User>;

    beforeEach(async () => {
      result = await jwtGuard.getAuthenticatableEntity(user._id);
    });

    it('calls `UserService::findOne` with the specified user-id', () => {
      expect(userService.findOne).toHaveBeenCalledTimes(1);
      expect(userService.findOne).toHaveBeenCalledWith(user._id);
    });

    it('returns the result of `UserService::findOne`', () => {
      expect(result).toBe(user);
    });
  });

  describe('validateAuthenticationJwt', () => {
    const jwt = 'json-web-token';
    const authenticatableEntityId = new Types.ObjectId();

    beforeAll(() => {
      tokenService.validateAuthenticationJwt.mockReturnValue({
        id: authenticatableEntityId.toString(),
      });
    });

    let result: Types.ObjectId;

    beforeEach(() => {
      result = jwtGuard.validateAuthenticationJwt(jwt);
    });

    it('calls `TokenService::validateAuthenticationJwt` with the specified jwt', () => {
      expect(tokenService.validateAuthenticationJwt).toHaveBeenCalledTimes(1);
      expect(tokenService.validateAuthenticationJwt).toHaveBeenCalledWith(
        jwtGuard['type'],
        jwt,
      );
    });

    it('returns the authenticatable-entity id from `TokenService::validateAuthenticationJwt`', () => {
      expect(result).toStrictEqual(authenticatableEntityId);
    });
  });
});
