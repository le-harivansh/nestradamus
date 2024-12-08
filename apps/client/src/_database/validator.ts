import { existenceValidatorFactory } from '@library/database';

import { User, UserSchema } from '../_user/schema/user.schema';

const modelCollectionMap = new Map([[User, UserSchema.collectionName]]);

export const ShouldExist = existenceValidatorFactory(modelCollectionMap, true);
export const ShouldNotExist = existenceValidatorFactory(
  modelCollectionMap,
  false,
);
