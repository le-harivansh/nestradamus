import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId, UpdateResult, WithId } from 'mongodb';

import { PasswordResetRepository } from '../repository/password-reset.repository';
import { PasswordReset } from '../schema/password-reset.schema';
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

  describe(
    PasswordResetService.prototype.findPasswordResetRecordById.name,
    () => {
      afterEach(() => {
        jest.resetAllMocks();
      });

      it(`calls '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.findById.name}' with the passed-in id`, async () => {
        const id = new ObjectId();

        await passwordResetService.findPasswordResetRecordById(id);

        expect(passwordResetRepository.findById).toHaveBeenCalledTimes(1);
        expect(passwordResetRepository.findById).toHaveBeenCalledWith(id);
      });

      it(`returns the result of '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.findById.name}' if it is not 'null'`, async () => {
        const passwordReset: WithId<PasswordReset> = {
          _id: new ObjectId(),
          ...new PasswordReset(new ObjectId(), new Date()),
        };

        passwordResetRepository.findById.mockResolvedValueOnce(
          passwordReset as any,
        );

        await expect(
          passwordResetService.findPasswordResetRecordById(passwordReset._id),
        ).resolves.toBe(passwordReset);
      });

      it(`throws a '${NotFoundException.name}' if '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.findById.name}' returns 'null'`, async () => {
        passwordResetRepository.findById.mockResolvedValueOnce(null);

        await expect(() =>
          passwordResetService.findPasswordResetRecordById(new ObjectId()),
        ).rejects.toThrow(NotFoundException);
      });
    },
  );

  describe(
    PasswordResetService.prototype.createOrUpdatePasswordResetRecordForUser
      .name,
    () => {
      describe(`- for non-existant '${PasswordReset.name}'s`, () => {
        beforeEach(() => {
          passwordResetRepository.findByUserId.mockResolvedValue(null);
        });

        afterEach(() => {
          jest.resetAllMocks();
        });

        it(`calls '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.create.name}' with the created '${PasswordReset.name}'`, async () => {
          const userId = new ObjectId();

          passwordResetRepository.create.mockResolvedValueOnce({
            acknowledged: true,
            insertedId: new ObjectId(),
          });

          await passwordResetService.createOrUpdatePasswordResetRecordForUser(
            userId,
          );

          expect(passwordResetRepository.create).toHaveBeenCalledTimes(1);
          expect(passwordResetRepository.create.mock.calls[0]![0]).toEqual({
            userId,
            createdAt: expect.any(Date),
          });
        });

        it(`returns the newly inserted '${PasswordReset.name}' with its associated '_id'`, async () => {
          const userId = new ObjectId();
          const insertedId = new ObjectId();

          passwordResetRepository.create.mockResolvedValueOnce({
            acknowledged: true,
            insertedId,
          });

          await expect(
            passwordResetService.createOrUpdatePasswordResetRecordForUser(
              userId,
            ),
          ).resolves.toEqual({
            _id: insertedId,
            userId,
            createdAt: expect.any(Date),
          });
        });

        it(`throws an '${InternalServerErrorException.name}' if the insertion could not be acknowledged`, async () => {
          passwordResetRepository.create.mockResolvedValueOnce({
            acknowledged: false,
            insertedId: undefined as unknown as ObjectId,
          });

          await expect(() =>
            passwordResetService.createOrUpdatePasswordResetRecordForUser(
              new ObjectId(),
            ),
          ).rejects.toThrow(InternalServerErrorException);
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
          passwordResetRepository.update.mockResolvedValueOnce({
            acknowledged: true,
          } as unknown as UpdateResult<PasswordReset>);

          await passwordResetService.createOrUpdatePasswordResetRecordForUser(
            passwordReset.userId,
          );

          expect(passwordResetRepository.update).toHaveBeenCalledTimes(1);
          expect(passwordResetRepository.update).toHaveBeenCalledWith(
            passwordReset._id,
            { createdAt: expect.any(Date) },
          );
        });

        it(`returns the updated '${PasswordReset.name}' with its associated '_id'`, async () => {
          passwordResetRepository.update.mockResolvedValueOnce({
            acknowledged: true,
          } as unknown as UpdateResult<PasswordReset>);

          await expect(
            passwordResetService.createOrUpdatePasswordResetRecordForUser(
              passwordReset.userId,
            ),
          ).resolves.toEqual({
            ...passwordReset,
            createdAt: expect.any(Date),
          });
        });

        it(`throws an '${InternalServerErrorException.name}' if the insertion could not be acknowledged`, async () => {
          passwordResetRepository.update.mockResolvedValueOnce({
            acknowledged: false,
          } as unknown as UpdateResult<PasswordReset>);

          await expect(() =>
            passwordResetService.createOrUpdatePasswordResetRecordForUser(
              new ObjectId(),
            ),
          ).rejects.toThrow(InternalServerErrorException);
        });
      });
    },
  );

  describe(
    PasswordResetService.prototype.deletePasswordResetRecord.name,
    () => {
      afterEach(() => {
        jest.resetAllMocks();
      });

      it(`calls '${PasswordResetRepository.name}::${PasswordResetRepository.prototype.delete.name}' with the passed-in id`, async () => {
        const id = new ObjectId();

        passwordResetRepository.delete.mockResolvedValueOnce({
          acknowledged: true,
          deletedCount: 1,
        });

        await passwordResetService.deletePasswordResetRecord(id);

        expect(passwordResetRepository.delete).toHaveBeenCalledTimes(1);
        expect(passwordResetRepository.delete).toHaveBeenCalledWith(id);
      });

      it(`throws an '${InternalServerErrorException.name}' if the deletion could not be acknowledged`, async () => {
        passwordResetRepository.delete.mockResolvedValueOnce({
          acknowledged: false,
          deletedCount: undefined as unknown as number,
        });

        await expect(() =>
          passwordResetService.deletePasswordResetRecord(new ObjectId()),
        ).rejects.toThrow(InternalServerErrorException);
      });

      it(`throws a '${NotFoundException.name}' if the no record was deleted`, async () => {
        passwordResetRepository.delete.mockResolvedValueOnce({
          acknowledged: true,
          deletedCount: 0,
        });

        await expect(() =>
          passwordResetService.deletePasswordResetRecord(new ObjectId()),
        ).rejects.toThrow(NotFoundException);
      });
    },
  );
});
