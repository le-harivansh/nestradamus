import { Test, TestingModule } from '@nestjs/testing';

import { RegistrationController } from './registration.controller';

describe(RegistrationController.name, () => {
  let controller: RegistrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationController],
    }).compile();

    controller = module.get(RegistrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // @todo: implement tests.
});
