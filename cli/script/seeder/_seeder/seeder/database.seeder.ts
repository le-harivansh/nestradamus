import { Injectable } from '@nestjs/common';

import { UserFactory } from '@/_user/_user/factory/user.factory';

@Injectable()
export class DatabaseSeeder {
  constructor(private readonly userFactory: UserFactory) {}

  async run() {
    await this.userFactory.generate(5);
  }
}
