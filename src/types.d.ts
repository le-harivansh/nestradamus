import { AdministratorDocument } from './_administration/_administrator/schema/administrator.schema';
import { UserDocument } from './_user/_user/schema/user.schema';

declare global {
  namespace Express {
    interface Request {
      administrator?: AdministratorDocument;
      user?: UserDocument;
    }
  }
}
