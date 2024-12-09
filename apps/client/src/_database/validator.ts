import { existenceValidatorFactory } from '@library/database';

import { MODEL_COLLECTION_MAP } from './constant';

/**
 * Decorator checking the existence of the specified model in the database.
 */
export const ShouldExist = existenceValidatorFactory(
  MODEL_COLLECTION_MAP,
  true,
);

/**
 * Decorator checking the absence of the specified model from the database.
 */
export const ShouldNotExist = existenceValidatorFactory(
  MODEL_COLLECTION_MAP,
  false,
);
