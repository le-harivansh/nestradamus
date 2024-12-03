import { Test, TestingModule } from '@nestjs/testing';
import { WithId } from 'mongodb';

import { User } from '../../../../src/_user/schema/user.schema';
import { UserService } from '../../../../src/_user/service/user.service';
import { SeederCommand } from './seeder.command';

jest.mock('../../../../src/_user/service/user.service');

describe(SeederCommand.name, () => {
  let databaseSeederCommand: SeederCommand;
  let userService: jest.Mocked<UserService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeederCommand, UserService],
    }).compile();

    databaseSeederCommand = module.get(SeederCommand);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(databaseSeederCommand).toBeDefined();
  });

  describe(SeederCommand.prototype.run.name, () => {
    afterAll(() => {
      jest.restoreAllMocks();
    });

    it(`calls '${SeederCommand.name}::${SeederCommand.prototype['seedUsers'].name}'`, async () => {
      const seedUsersSpy = jest
        .spyOn(
          SeederCommand.prototype as unknown as { seedUsers: () => undefined },
          'seedUsers',
        )
        .mockImplementation(() => undefined);

      await databaseSeederCommand.run();

      expect(seedUsersSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe(SeederCommand.prototype['seedUsers'].name, () => {
    it(`throws an '${Error.name}' if the provided count is < 1`, () => {
      return expect(
        async () => await databaseSeederCommand['seedUsers'](0),
      ).rejects.toThrow(Error);
    });

    it(`calls '${UserService.name}::${UserService.prototype.create.name}' "count" no. of times`, async () => {
      const COUNT = 7;

      await databaseSeederCommand['seedUsers'](COUNT);

      expect(userService.create).toHaveBeenCalledTimes(COUNT);
    });

    it(`returns the values of '${UserService.name}::${UserService.prototype.create.name}' ("count" times)`, async () => {
      const resolvedUser = Symbol('resolved user') as unknown;
      const COUNT = 5;

      userService.create.mockResolvedValue(
        resolvedUser as unknown as WithId<User>,
      );

      const users = await databaseSeederCommand['seedUsers'](COUNT);

      expect(users.length).toBe(COUNT);
      expect(users.every((user) => user === resolvedUser)).toBe(true);
    });
  });
});
