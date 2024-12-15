import { WithId } from 'mongodb';

import { User } from '../_user/schema/user.schema';
import { PERMISSION_STRING_SEPARATOR } from './constant';

export function createPermissionsMap() {
  return {
    user: {
      /**
       * A user can list all the available users.
       */
      list: () => true,

      /**
       * A user can create another user.
       */
      create: () => true,

      read: {
        /**
         * A user can read its own data.
         */
        own: () => true,

        /**
         * A user can read other users' data.
         * It can *HOWEVER* read its own data only if it has the 'user:read:own'
         * permission.
         */
        others: (
          authenticatedUser: WithId<User>,
          { userId }: { userId: string },
        ) =>
          !authenticatedUser._id.equals(userId) ||
          authenticatedUser.permissions.includes(
            `user${PERMISSION_STRING_SEPARATOR}read${PERMISSION_STRING_SEPARATOR}own`,
          ),
      },

      update: {
        /**
         * A user can update its own data.
         */
        own: () => true,

        /**
         * A user can update another user, but NOT itself.
         *
         * This is done because a user typically requires a confirmation cookie
         * to be able to update itself.
         */
        others: (
          authenticatedUser: WithId<User>,
          { userId }: { userId: string },
        ) => !authenticatedUser._id.equals(userId),
      },

      delete: {
        /**
         * A user can delete itself.
         */
        own: () => true,

        /**
         * A user can delete another user, but NOT itself.
         *
         * This is done because a user typically requires a confirmation cookie
         * to be able to delete itself.
         */
        others: (
          authenticatedUser: WithId<User>,
          { userId }: { userId: string },
        ) => !authenticatedUser._id.equals(userId),
      },
    },
  };
}
