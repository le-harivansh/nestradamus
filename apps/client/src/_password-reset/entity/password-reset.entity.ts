import { ObjectId } from 'mongodb';

export class PasswordReset {
  constructor(
    public readonly userId: ObjectId,
    public readonly createdAt: Date,
  ) {}
}
