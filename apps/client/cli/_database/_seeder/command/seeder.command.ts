import { WithId } from 'mongodb';
import { CommandRunner, SubCommand } from 'nest-commander';

import { User } from '../../../../src/_user/schema/user.schema';
import { UserService } from '../../../../src/_user/service/user.service';
import { fakeUserData } from '../../../../test/helper';

@SubCommand({ name: 'seed', description: 'Seed the client database.' })
export class SeederCommand extends CommandRunner {
  constructor(private readonly userService: UserService) {
    super();
  }

  override async run(): Promise<void> {
    await this.seedUsers(5);
  }

  private seedUsers(count: number): Promise<Omit<WithId<User>, 'password'>[]> {
    if (count < 1) {
      throw new Error('The provided count cannot be less than 1.');
    }

    const userSeedingTasksQueue: Promise<Omit<WithId<User>, 'password'>>[] = [];

    userSeedingTasksQueue.push(
      this.userService.createUser(fakeUserData({ email: 'user@email.dev' })),
    );

    for (let i = 0; i < count - 1; i++) {
      userSeedingTasksQueue.push(this.userService.createUser(fakeUserData()));
    }

    return Promise.all(userSeedingTasksQueue);
  }
}
