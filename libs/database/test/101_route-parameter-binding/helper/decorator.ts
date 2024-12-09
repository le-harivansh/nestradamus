import { routeParameterResolverPipeFactory } from '../../../src';
import { TEST_COLLECTION_NAME } from './constant';
import { User } from './user.model';

const modelCollectionMap = new Map([[User, TEST_COLLECTION_NAME]]);

export const Model = routeParameterResolverPipeFactory(modelCollectionMap);
