import { Injectable } from '@nestjs/common';

import { AdministratorFactory } from '@/_administration/_administrator/factory/administrator.factory';
import { UserFactory } from '@/_user/_user/factory/user.factory';

@Injectable()
export class DatabaseSeeder {
  constructor(
    private readonly userFactory: UserFactory,
    private readonly administratorFactory: AdministratorFactory,
  ) {}

  async run() {
    await this.userFactory.generate(15);
    await this.administratorFactory.generate(5);
  }
}
