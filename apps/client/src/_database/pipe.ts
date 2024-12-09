import { routeParameterResolverPipeFactory } from '@library/database';

import { MODEL_COLLECTION_MAP } from './constant';

/**
 * Pipe resolving the specified model from the database.
 */
export const Model = routeParameterResolverPipeFactory(MODEL_COLLECTION_MAP);
