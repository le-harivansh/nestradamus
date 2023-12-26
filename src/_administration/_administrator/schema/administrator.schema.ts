import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { argon2id, hash } from 'argon2';

import { Authenticatable } from '@/_library/authentication/schema/authenticatable.interface';

@Schema({ timestamps: true })
export class Administrator implements Authenticatable {
  /**
   * In this application, the username is also the email address of the
   * administrator.
   *
   * This is done because we don't want the added hassle and complexity that
   * adding a new 'email' property would bring.
   */
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true })
  password!: string;
}

export const AdministratorSchema = SchemaFactory.createForClass(Administrator);

AdministratorSchema.pre('save', async function (): Promise<void> {
  if (this.isModified('password')) {
    this.password = await hash(this.password, { type: argon2id });
  }
});
