import { faker } from '@faker-js/faker';
import { WithId } from 'mongodb';
import { CommandRunner, SubCommand } from 'nest-commander';

import { PERMISSION_STRING_SEPARATOR } from '../../../../src/_authorization/constant';
import { User } from '../../../../src/_user/schema/user.schema';
import { UserService } from '../../../../src/_user/service/user.service';

@SubCommand({ name: 'seed', description: 'Seed the client database.' })
export class SeederCommand extends CommandRunner {
  constructor(private readonly userService: UserService) {
    super();
  }

  override async run(): Promise<void> {
    await this.createDefaultUser();
    await this.seedUsers(2);
  }

  private createDefaultUser() {
    return this.userService.create({
      firstName: 'FirstName',
      lastName: 'LastName',
      email: 'user@email.dev',
      password: 'password',
      permissions: [
        `user${PERMISSION_STRING_SEPARATOR}read${PERMISSION_STRING_SEPARATOR}own`,
        `user${PERMISSION_STRING_SEPARATOR}update${PERMISSION_STRING_SEPARATOR}own`,
        `user${PERMISSION_STRING_SEPARATOR}delete${PERMISSION_STRING_SEPARATOR}own`,
      ],
    });
  }

  private seedUsers(count: number): Promise<WithId<User>[]> {
    if (count < 1) {
      throw new Error('The provided count cannot be less than 1.');
    }

    const userSeedingTasksQueue: Promise<WithId<User>>[] = [];

    for (let i = 0; i < count; i++) {
      userSeedingTasksQueue.push(
        this.userService.create({
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: faker.internet.email(),
          password: 'password',
          permissions: [],
        }),
      );
    }

    return Promise.all(userSeedingTasksQueue);
  }
}
