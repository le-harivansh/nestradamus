import { Test, TestingModule } from '@nestjs/testing';

import { AuthenticationController } from './authentication.controller';

describe(AuthenticationController.name, () => {
  let controller: AuthenticationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
    }).compile();

    controller = module.get(AuthenticationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // @todo: add tests.
});
