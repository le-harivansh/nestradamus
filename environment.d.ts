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

      USER_JWT_ACCESS_TOKEN_SECRET: string;
      USER_JWT_ACCESS_TOKEN_DURATION: string;

      USER_JWT_REFRESH_TOKEN_SECRET: string;
      USER_JWT_REFRESH_TOKEN_DURATION: string;

      ADMINISTRATOR_JWT_ACCESS_TOKEN_SECRET: string;
      ADMINISTRATOR_JWT_ACCESS_TOKEN_DURATION: string;

      ADMINISTRATOR_JWT_REFRESH_TOKEN_SECRET: string;
      ADMINISTRATOR_JWT_REFRESH_TOKEN_DURATION: string;

      MAIL_SMTP_HOST: string;
      MAIL_SMTP_PORT: number;
      MAIL_FROM_ADDRESS: string;

      QUEUE_PREFIX: string;
      QUEUE_REDIS_HOST: string;
      QUEUE_REDIS_PORT: number;
    }
  }
}

/**
 * This empty export is needed to convert this file into a module.
 */
export {};
