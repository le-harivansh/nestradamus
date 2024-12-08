import { existenceValidatorFactory } from '../../src';
import { TEST_COLLECTION_NAME } from './constant';
import { User } from './user.model';

const modelCollectionMap = new Map([[User, TEST_COLLECTION_NAME]]);

export const ShouldExist = existenceValidatorFactory(modelCollectionMap, true);
export const ShouldNotExist = existenceValidatorFactory(
  modelCollectionMap,
  false,
);
