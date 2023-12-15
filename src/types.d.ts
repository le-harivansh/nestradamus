import { UserDocument } from '@/_user/_user/schema/user.schema';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}
