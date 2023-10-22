import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { argon2id, hash } from 'argon2';

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hash(this.password, { type: argon2id });
  }
});

/**
 * @todo: Instead of using the following, use the `User` class.
 * Check if `_id` can be added to the class.
 */
export type RequestUser = Omit<User, 'password'> & { id: string };
