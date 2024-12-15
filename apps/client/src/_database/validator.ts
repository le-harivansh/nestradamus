import { existenceValidatorFactory } from '@library/database';

import { ENTITY_COLLECTION_MAP } from './constant';

/**
 * Decorator checking the existence of the specified entity in the database.
 */
export const ShouldExist = existenceValidatorFactory(
  ENTITY_COLLECTION_MAP,
  true,
);

/**
 * Decorator checking the absence of the specified entity from the database.
 */
export const ShouldNotExist = existenceValidatorFactory(
  ENTITY_COLLECTION_MAP,
  false,
);
