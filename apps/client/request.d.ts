import { WithId } from 'mongodb';

import { User } from './src/_user/schema/user.schema';

declare global {
  namespace Express {
    interface Request {
      user?: WithId<User>;
    }
  }
}

/**
 * This empty export is needed to convert this file into a module.
 */
export {};
