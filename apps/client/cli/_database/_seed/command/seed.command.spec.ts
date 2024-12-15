import { Test, TestingModule } from '@nestjs/testing';

import { UserSeeder } from '../seeder/user.seeder';
import { SeedCommand } from './seed.command';

jest.mock('../seeder/user.seeder');

describe(SeedCommand.name, () => {
  let seedCommand: SeedCommand;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSeeder, SeedCommand],
    }).compile();

    seedCommand = module.get(SeedCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(seedCommand).toBeDefined();
  });
});
