import { User } from '../_user/entity/user.entity';
import { UserSchema } from '../_user/entity/user.schema';

export const ENTITY_COLLECTION_MAP = new Map([
  [User, UserSchema.collectionName],
]);
