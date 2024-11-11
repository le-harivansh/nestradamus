import {
  HttpStatus,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AuthenticationModule } from '@library/authentication';

import { authenticationModuleConfiguration, Configuration } from './constant';

export async function setupTestApplication() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AuthenticationModule.forRoot(authenticationModuleConfiguration)],
  }).compile();

  const application = moduleFixture.createNestApplication();

  /**
   * Cookies need to be signed, since the authentication middlewares:
   * `RequiresAccessTokenMiddleware` & `RequiresRefreshTokenMiddleware`
   * look for the JSON Web Token in *SIGNED* _HTTP-only_ cookies.
   */
  application.use(cookieParser(Configuration.APPLICATION_SECRET));

  return application.init();
}

export async function getAuthenticationTokens<
  T extends Record<string, string>,
  U extends { [K in keyof T]: string },
>(
  credentials: { username: string; password: string },
  application: INestApplication,
  loginRoute: string,
  cookiesToRetrieve: T, // in the form: { arbitraryKeyName: cookieName }
): Promise<U> {
  const response = await request(application.getHttpServer())
    .post(loginRoute)
    .send(credentials);

  const cookies = response.get('Set-Cookie');

  if (response.status !== HttpStatus.NO_CONTENT) {
    throw new UnauthorizedException(
      'Could not authenticate user with the provided credentials.',
    );
  }

  return Object.entries(cookiesToRetrieve)
    .map(([key, cookieName]) => ({
      [key]: cookies.find((cookie) => cookie.startsWith(cookieName)),
    }))
    .filter((cookieData) => Boolean(Object.values(cookieData)[0]))
    .reduce(
      (cookieInformation, cookieData) => ({
        ...cookieInformation,
        ...cookieData,
      }),
      {},
    ) as U;
}
