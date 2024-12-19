import { WithId } from 'mongodb';

import { User } from './src/_user/entity/user.entity';

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
