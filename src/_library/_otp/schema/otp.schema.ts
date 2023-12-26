import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { argon2id, hash } from 'argon2';

@Schema({ timestamps: true })
export class Otp {
  /**
   * This property refers to the feature the OTP is being used for;
   * e.g.: Registration, ...
   *
   * It is used to discriminate against other OTP types during validation.
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
