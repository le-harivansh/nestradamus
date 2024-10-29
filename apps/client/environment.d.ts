declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'test' | 'development' | 'production';

      APPLICATION_NAME: string;
      APPLICATION_PORT: string;
      APPLICATION_SECRET: string;

      FRONTEND_URL: string;

      DATABASE_SCHEME: string;
      DATABASE_HOST: string;
      DATABASE_PORT: string;
      DATABASE_USERNAME: string;
      DATABASE_PASSWORD: string;
      DATABASE_NAME: string;

      MAIL_HOST: string;
      MAIL_PORT: string;
      MAIL_USERNAME: string;
      MAIL_PASSWORD: string;
      MAIL_DEFAULT_FROM_NAME: string;
      MAIL_DEFAULT_FROM_ADDRESS: string;

      PASSWORD_RESET_VALID_FOR_SECONDS: string;
    }
  }
}

/**
 * This empty export is needed to convert this file into a module.
 */
export {};
