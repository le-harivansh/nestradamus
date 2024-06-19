import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';

import { AUTHENTICATION_MODULE_OPTIONS_TOKEN } from '../authentication.module-definition';
import { UserIdExtractorService } from './user-id-extractor.service';

jest.mock('../service/user-resolver.service');

describe(UserIdExtractorService.name, () => {
  const userId = new ObjectId().toString();
  const userIdExtractor = jest.fn().mockReturnValue(userId);
  const authenticationModuleOptions = {
    callbacks: {
      extractUserId: userIdExtractor,
    },
  };

  let userIdExtractorService: UserIdExtractorService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_OPTIONS_TOKEN,
          useValue: authenticationModuleOptions,
        },
        UserIdExtractorService,
      ],
    }).compile();

    userIdExtractorService = module.get(UserIdExtractorService);
  });

  it('should be defined', () => {
    expect(userIdExtractorService).toBeDefined();
  });

  describe(UserIdExtractorService.prototype.extractId.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls the resolved user-id extractor with the passed in user instance', () => {
      const user = Symbol('User instance');

      userIdExtractorService.extractId(user);

      expect(userIdExtractor).toHaveBeenCalledTimes(1);
      expect(userIdExtractor).toHaveBeenCalledWith(user);
    });

    it('returns the extracted user-id', () => {
      expect(userIdExtractorService.extractId(null)).toBe(userId);
    });
  });
});
