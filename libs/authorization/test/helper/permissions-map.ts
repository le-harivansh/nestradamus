import { TestUser } from './test-user';

export const permissionsMap = {
  test: {
    list: () => true,
    read: {
      own: () => true,
      others: () => false,
    },
    create: () => true,
    update: (
      authenticatedUser: TestUser,
      { taskCreatorId }: { taskCreatorId: string },
    ) => authenticatedUser.id === taskCreatorId,
    delete: {
      own: () => true,
    },
  },
};
