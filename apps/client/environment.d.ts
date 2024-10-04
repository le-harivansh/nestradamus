declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'test' | 'development' | 'production';

      APPLICATION_NAME: string;
      APPLICATION_PORT: string;
      APPLICATION_SECRET: string;

      DATABASE_SCHEME: string;
      DATABASE_HOST: string;
      DATABASE_PORT: string;
      DATABASE_USERNAME: string;
      DATABASE_PASSWORD: string;
      DATABASE_NAME: string;
    }
  }
}

/**
 * This empty export is needed to convert this file into a module.
 */
export {};
