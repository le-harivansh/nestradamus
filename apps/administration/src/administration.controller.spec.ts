import { Test, TestingModule } from '@nestjs/testing';

import { AdministrationController } from './administration.controller';
import { AdministrationService } from './administration.service';

describe('AdministrationController', () => {
  let administrationController: AdministrationController;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AdministrationController],
      providers: [AdministrationService],
    }).compile();

    administrationController = app.get<AdministrationController>(
      AdministrationController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(administrationController.getHello()).toBe('[ADMIN] Hello World!');
    });
  });
});
