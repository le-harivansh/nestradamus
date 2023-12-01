import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { argon2id, hash } from 'argon2';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Otp {
  /**
   * This property refers to the feature the OTP is being used for;
   * e.g.: Registration, ...
   */
  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  destination!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true, expires: 0 })
  expiresAt!: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.pre('save', async function (): Promise<void> {
  if (this.isModified('password')) {
    this.password = await hash(this.password, { type: argon2id });
  }
});

export type OtpDocument = HydratedDocument<Otp>;
