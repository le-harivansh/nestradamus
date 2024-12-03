import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';

import { TestController } from './test.controller';
import { TestModule } from './test.module';

export async function setupTestApplication() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestModule],
    controllers: [TestController],
  }).compile();

  const application = moduleFixture.createNestApplication();

  /**
   * Cookies need to be signed, since the password-confirmation guard:
   * `RequiresPasswordConfirmation` stores data to & retrieves data from
   * *SIGNED* _HTTP-only_ cookies.
   */
  application.use(cookieParser('application-secret'));

  return application.init();
}
