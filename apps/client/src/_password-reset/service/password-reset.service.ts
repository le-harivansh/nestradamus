import { Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId, WithId } from 'mongodb';

import { PasswordResetRepository } from '../repository/password-reset.repository';
import { PasswordReset } from '../schema/password-reset.schema';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly passwordResetRepository: PasswordResetRepository,
  ) {}

  async findById(id: ObjectId) {
    const fetchedPasswordResetRecord =
      await this.passwordResetRepository.findById(id);

    if (fetchedPasswordResetRecord === null) {
      throw new NotFoundException(
        `Could not find the 'password-reset' record with id: '${id}'.`,
      );
    }

    return fetchedPasswordResetRecord;
  }

  async createOrUpdateForUser(
    userId: ObjectId,
  ): Promise<WithId<PasswordReset>> {
    const existingPasswordReset =
      await this.passwordResetRepository.findByUserId(userId);

    return existingPasswordReset === null
      ? await this.passwordResetRepository.create(
          new PasswordReset(userId, new Date()),
        )
      : (await this.passwordResetRepository.update(existingPasswordReset._id, {
          createdAt: new Date(),
        }))!;
  }

  async delete(id: ObjectId) {
    await this.passwordResetRepository.delete(id);
  }
}
