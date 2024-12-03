export function createPermissionsMap() {
  return {
    user: {
      read: {
        own: () => true, // a user can read its own data
      },

      update: {
        own: () => true, // a user can update its own data
      },

      delete: {
        own: () => true, // a user can delete its own data
      },
    },
  };
}
