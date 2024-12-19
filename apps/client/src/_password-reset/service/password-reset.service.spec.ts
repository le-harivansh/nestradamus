import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId, WithId } from 'mongodb';

import { PasswordReset } from '../entity/password-reset.entity';
import { PasswordResetRepository } from '../repository/password-reset.repository';
import { PasswordResetService } from './password-reset.service';

jest.mock('../repository/password-reset.repository');

describe(PasswordResetService.name, () => {
  let passwordResetService: PasswordResetService;
  let passwordResetRepository: jest.Mocked<PasswordResetRepository>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordResetRepository, PasswordResetService],
    }).compile();

    passwordResetService = module.get(PasswordResetService);
    passwordResetRepository = module.get(PasswordResetRepository);
  });

  it('should be defined', () => {
    expect(passwordResetService).toBeDefined();
  });

  describe(PasswordResetService.prototype.findById.name, () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it(`calls '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.findById.name}' with the passed-in id`, async () => {
      const id = new ObjectId();

      await passwordResetService.findById(id);

      expect(passwordResetRepository.findById).toHaveBeenCalledTimes(1);
      expect(passwordResetRepository.findById).toHaveBeenCalledWith(id);
    });

    it(`returns the result of '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.findById.name}' if it is not 'null'`, async () => {
      const passwordReset: WithId<PasswordReset> = {
        _id: new ObjectId(),
        ...new PasswordReset(new ObjectId(), new Date()),
      };

      passwordResetRepository.findById.mockResolvedValueOnce(
        passwordReset as unknown as ReturnType<
          PasswordResetRepository['findById']
        >,
      );

      await expect(
        passwordResetService.findById(passwordReset._id),
      ).resolves.toBe(passwordReset);
    });

    it(`throws a '${NotFoundException.name}' if '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.findById.name}' returns 'null'`, async () => {
      passwordResetRepository.findById.mockResolvedValueOnce(null);

      await expect(() =>
        passwordResetService.findById(new ObjectId()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe(PasswordResetService.prototype.createOrUpdateForUser.name, () => {
    describe(`- for non-existant '${PasswordReset.name}'s`, () => {
      beforeEach(() => {
        passwordResetRepository.findByUserId.mockResolvedValue(null);
      });

      afterEach(() => {
        jest.resetAllMocks();
      });

      it(`calls '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.create.name}' with the created '${PasswordReset.name}'`, async () => {
        const userId = new ObjectId();

        await passwordResetService.createOrUpdateForUser(userId);

        expect(passwordResetRepository.create).toHaveBeenCalledTimes(1);
        expect(passwordResetRepository.create).toHaveBeenCalledWith(
          new PasswordReset(userId, expect.any(Date)),
        );
      });

      it(`returns the result of '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.create.name}'`, async () => {
        const newPasswordReset = Symbol('New password-reset');

        passwordResetRepository.create.mockResolvedValueOnce(
          newPasswordReset as unknown as WithId<PasswordReset>,
        );

        await expect(
          passwordResetService.createOrUpdateForUser(new ObjectId()),
        ).resolves.toBe(newPasswordReset);
      });
    });

    describe(`- for existing '${PasswordReset.name}'s`, () => {
      const passwordReset: WithId<PasswordReset> = {
        _id: new ObjectId(),
        ...new PasswordReset(new ObjectId(), new Date()),
      };

      beforeEach(() => {
        passwordResetRepository.findByUserId.mockResolvedValue(passwordReset);
      });

      afterEach(() => {
        jest.resetAllMocks();
      });

      it(`calls '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.update.name}' with the existing '${PasswordReset.name}'-id & the current date`, async () => {
        await passwordResetService.createOrUpdateForUser(passwordReset.userId);

        expect(passwordResetRepository.update).toHaveBeenCalledTimes(1);
        expect(passwordResetRepository.update).toHaveBeenCalledWith(
          passwordReset._id,
          { createdAt: expect.any(Date) },
        );
      });

      it(`returns the result of '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.update.name}'`, async () => {
        const updatedPasswordReset = Symbol('Updated password-reset');

        passwordResetRepository.update.mockResolvedValueOnce(
          updatedPasswordReset as unknown as WithId<PasswordReset>,
        );

        await expect(
          passwordResetService.createOrUpdateForUser(passwordReset.userId),
        ).resolves.toBe(updatedPasswordReset);
      });
    });
  });

  describe(PasswordResetService.prototype.delete.name, () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it(`calls '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.delete.name}' with the passed-in id`, async () => {
      const id = new ObjectId();

      await passwordResetService.delete(id);

      expect(passwordResetRepository.delete).toHaveBeenCalledTimes(1);
      expect(passwordResetRepository.delete).toHaveBeenCalledWith(id);
    });
  });
});
