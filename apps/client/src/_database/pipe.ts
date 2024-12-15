import { routeParameterResolverPipeFactory } from '@library/database';

import { ENTITY_COLLECTION_MAP } from './constant';

/**
 * Pipe resolving the specified entity from the database.
 */
export const Entity = routeParameterResolverPipeFactory(ENTITY_COLLECTION_MAP);
