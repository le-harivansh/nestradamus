import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';

describe('ApplicationController', () => {
  let applicationController: ApplicationController;

  beforeEach(async () => {
    const application: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationController],
      providers: [ApplicationService],
    }).compile();

    applicationController = application.get(ApplicationController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(applicationController.getHello()).toBe('Hello World!');
    });
  });
});
