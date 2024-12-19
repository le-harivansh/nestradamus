import { Test, TestingModule } from '@nestjs/testing';

import { PasswordResetSchema } from '../../../../src/_password-reset/entity/password-reset.schema';
import { UserSchema } from '../../../../src/_user/entity/user.schema';
import { InitializationCommand } from './initialization.command';

jest.mock('../../../../src/_user/entity/user.schema');
jest.mock('../../../../src/_password-reset/entity/password-reset.schema');

describe(InitializationCommand.name, () => {
  let initCommand: InitializationCommand;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InitializationCommand, UserSchema, PasswordResetSchema],
    }).compile();

    initCommand = module.get(InitializationCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(initCommand).toBeDefined();
  });
});
