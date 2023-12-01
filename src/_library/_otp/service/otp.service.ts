import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { verify } from 'argon2';
import { Model } from 'mongoose';

import { Otp, OtpDocument } from '../schema/otp.schema';

@Injectable()
export class OtpService {
  static readonly PASSWORD_LENGTH = 6;

  constructor(@InjectModel(Otp.name) private readonly otpModel: Model<Otp>) {}

  async create(
    type: Otp['type'],
    destination: Otp['destination'],
    ttlSeconds: number,
  ): Promise<OtpDocument> {
    const password = OtpService.generateNumericPassword(
      OtpService.PASSWORD_LENGTH,
    );

    const newOtp = await this.otpModel.create({
      type,
      destination,
      password,
      expiresAt: new Date(Date.now() + 1000 * ttlSeconds),
    });

    /**
     * We set the `cleartext` password here, because we need the `cleartext`
     * password in the subsequent steps (e.g.: when creating the OTP email...).
     */
    return newOtp.set('password', password);
  }

  async find(
    type: Otp['type'],
    destination: Otp['destination'],
  ): Promise<OtpDocument[]> {
    const retrievedOtp = await this.otpModel
      .find({ type, destination, expiresAt: { $gt: new Date() } })
      .exec();

    if (retrievedOtp.length === 0) {
      throw new NotFoundException(
        `Could not find any OTP matching: [type: '${type}', destination: '${destination}'].`,
      );
    }

    return retrievedOtp;
  }

  async isValid(
    password: Otp['password'],
    { type, destination }: Pick<Otp, 'type' | 'destination'>,
  ): Promise<boolean> {
    try {
      const retrievedOtps = await this.find(type, destination);

      const atLeastOneMatchingOtpIsValid = (
        await Promise.all(
          retrievedOtps.map((otp) => verify(otp.get('password'), password)),
        )
      ).reduce((previous, current) => previous || current, false);

      /**
       * If an OTP has been validated, it - and similar ones
       * (i.e.: ones having the same `type` & `destination`) - are removed to
       * prevent replay attacks.
       */
      if (atLeastOneMatchingOtpIsValid) {
        await this.otpModel.deleteMany({
          _id: { $in: retrievedOtps.map(({ _id }) => _id) },
        });
      }

      return atLeastOneMatchingOtpIsValid;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    return false;
  }

  static generateNumericPassword(length: number): string {
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

    return [...Array(length)]
      .map(() => numbers[Math.floor(Math.random() * numbers.length)])
      .join('');
  }
}
