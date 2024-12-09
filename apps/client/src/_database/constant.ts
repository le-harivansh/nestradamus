import { User, UserSchema } from '../_user/schema/user.schema';

export const MODEL_COLLECTION_MAP = new Map([
  [User, UserSchema.collectionName],
]);
