import { Test, TestingModule } from '@nestjs/testing';

import { UserController } from './user.controller';

describe(UserController.name, () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
    }).compile();

    controller = module.get(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // @todo: implement tests.
});
