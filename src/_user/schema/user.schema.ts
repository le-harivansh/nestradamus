import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { argon2id, hash } from 'argon2';

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true })
  password!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hash(this.password, { type: argon2id });
  }
});

/**
 * This type represents the type of the user stored in `request.user` after
 * the authentication process.
 */
export type RequestUser = Omit<User, 'password'> & { id: string };
