import { TestUser } from './test-user';

export const permissionsMap = {
  test: {
    read: {
      own: () => true,
      others: () => false,
    },
    create: () => true,
    update: (
      authenticatedUser: TestUser,
      { taskCreatorId }: { taskCreatorId: string },
    ) => authenticatedUser.id === taskCreatorId,
  },
};
