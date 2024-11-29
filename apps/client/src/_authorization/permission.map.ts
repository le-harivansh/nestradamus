export function createPermissionsMap() {
  return {
    user: {
      read: {
        own: () => true,
      },

      update: {
        own: () => true,
      },

      delete: {
        own: () => true,
      },
    },
  };
}
