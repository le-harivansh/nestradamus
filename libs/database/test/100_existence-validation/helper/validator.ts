import { existenceValidatorFactory } from '../../../src';
import { TEST_COLLECTION_NAME } from './constant';
import { User } from './user.entity';

const entityCollectionMap = new Map([[User, TEST_COLLECTION_NAME]]);

export const ShouldExist = existenceValidatorFactory(entityCollectionMap, true);
export const ShouldNotExist = existenceValidatorFactory(
  entityCollectionMap,
  false,
);