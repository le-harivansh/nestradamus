import { Test, TestingModule } from '@nestjs/testing';

import { DATABASE } from '@library/database';

import { DropCommand } from './drop.command';

describe(DropCommand.name, () => {
  let dropCommand: DropCommand;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DATABASE,
          useValue: undefined,
        },

        DropCommand,
      ],
    }).compile();

    dropCommand = module.get(DropCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(dropCommand).toBeDefined();
  });
});
