import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ObjectId, WithId } from 'mongodb';

import { PasswordResetRepository } from '../repository/password-reset.repository';
import { PasswordReset } from '../schema/password-reset.schema';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly passwordResetRepository: PasswordResetRepository,
  ) {}

  async findPasswordResetRecordById(id: ObjectId) {
    const fetchedPasswordResetRecord =
      await this.passwordResetRepository.findById(id);

    if (fetchedPasswordResetRecord === null) {
      throw new NotFoundException(
        `Could not find the password-reset record with id: '${id}'.`,
      );
    }

    return fetchedPasswordResetRecord;
  }

  async createOrUpdatePasswordResetRecordForUser(
    userId: ObjectId,
  ): Promise<WithId<PasswordReset>> {
    let acknowledged = false;
    let passwordResetId: ObjectId;

    const existingPasswordReset =
      await this.passwordResetRepository.findByUserId(userId);

    const createdAt = new Date();

    if (existingPasswordReset === null) {
      const passwordResetData = new PasswordReset(userId, createdAt);

      ({ acknowledged, insertedId: passwordResetId } =
        await this.passwordResetRepository.create(passwordResetData));
    } else {
      passwordResetId = existingPasswordReset._id;

      ({ acknowledged } = await this.passwordResetRepository.update(
        passwordResetId,
        { createdAt },
      ));
    }

    if (!acknowledged) {
      throw new InternalServerErrorException(
        `Could not acknowledge the creation/update request for the 'password-reset' record with data: ${JSON.stringify({ userId, createdAt })}.`,
      );
    }

    return {
      _id: passwordResetId,
      userId,
      createdAt,
    };
  }

  async deletePasswordResetRecord(id: ObjectId) {
    const { acknowledged, deletedCount } =
      await this.passwordResetRepository.delete(id);

    if (!acknowledged) {
      throw new InternalServerErrorException(
        `Could not acknowledge the deletion request for the 'password-reset' record with id: '${id}'.`,
      );
    }

    if (deletedCount === 0) {
      throw new NotFoundException(
        `Could not find & delete 'password-reset' record with id: '${id}'.`,
      );
    }
  }
}
