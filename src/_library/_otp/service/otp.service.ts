import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { verify } from 'argon2';
import { HydratedDocument, Model } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { generateNumericPasswordOfLength } from '@/_library/helper';

import { Otp } from '../schema/otp.schema';

@Injectable()
export class OtpService {
  static readonly PASSWORD_LENGTH = 6;

  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<Otp>,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(OtpService.name);
  }

  async create(
    type: string,
    destination: string,
    ttlSeconds: number,
  ): Promise<HydratedDocument<Otp>> {
    const password = generateNumericPasswordOfLength(
      OtpService.PASSWORD_LENGTH,
    );

    const newOtp = await this.otpModel.create({
      type,
      destination,
      password,
      expiresAt: new Date(Date.now() + 1000 * ttlSeconds),
    });

    this.loggerService.log('Created new OTP', newOtp);

    /**
     * We set the `cleartext` password here, because we need the `cleartext`
     * password in the subsequent steps (e.g.: when creating the OTP email...).
     */
    return newOtp.set('password', password);
  }

  async isValid(
    password: string,
    { type, destination }: { type: string; destination: string },
  ): Promise<boolean> {
    const retrievedOtps = await this.otpModel
      .find({ type, destination, expiresAt: { $gt: new Date() } })
      .exec();

    const atLeastOneMatchingOtpIsValid = (
      await Promise.all(
        retrievedOtps.map((otp) => verify(otp.get('password'), password)),
      )
    ).reduce((previous, current) => previous || current, false);

    this.loggerService.log(
      atLeastOneMatchingOtpIsValid
        ? 'Found at least 1 matching OTP'
        : 'Did not find any matching OTP',
      { type, destination },
    );

    /**
     * If an OTP has been validated, it - and similar ones
     * (i.e.: ones having the same `type` & `destination`) - is removed to
     * prevent replay attacks.
     */
    if (atLeastOneMatchingOtpIsValid) {
      const { deletedCount } = await this.otpModel.deleteMany({
        _id: { $in: retrievedOtps.map(({ _id }) => _id) },
      });

      this.loggerService.log(`Deleted all ${deletedCount} OTP(s) matching`, {
        type,
        destination,
      });
    }

    this.loggerService.log(
      `OTP ${atLeastOneMatchingOtpIsValid ? 'is' : 'is not'} valid`,
      { type, destination },
    );

    return atLeastOneMatchingOtpIsValid;
  }
}
