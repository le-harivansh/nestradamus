declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'test' | 'development' | 'production';

      APPLICATION_NAME: string;
      APPLICATION_PORT: number;

      APPLICATION_THROTTLER_TTL: string;
      APPLICATION_THROTTLER_REQUEST_LIMIT: number;

      DATABASE_HOST: string;
      DATABASE_PORT: number;
      DATABASE_USERNAME: string;
      DATABASE_PASSWORD: string;
      DATABASE_NAME: string;

      JWT_ACCESS_TOKEN_SECRET: string;
      JWT_ACCESS_TOKEN_DURATION: string;

      JWT_REFRESH_TOKEN_SECRET: string;
      JWT_REFRESH_TOKEN_DURATION: string;
    }
  }
}

/**
 * This empty export is needed to convert this file into a module.
 */
export {};
