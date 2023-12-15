import { INestApplication, InternalServerErrorException } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationArguments } from 'class-validator';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';

import { ConnectionName } from '@/_application/_database/constant';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';

import {
  ExistenceConstraint,
  ExistenceValidatorConstraint,
} from './existence.constraint';

describe(ExistenceValidatorConstraint.name, () => {
  let application: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;

  let validatorConstraint: ExistenceValidatorConstraint<typeof User>;

  let userModel: Model<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          async useFactory() {
            mongoMemoryServer = await MongoMemoryServer.create();

            return { uri: mongoMemoryServer.getUri() };
          },
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [ExistenceValidatorConstraint<typeof User>],
    }).compile();

    application = moduleFixture.createNestApplication();
    validatorConstraint = application.get(ExistenceValidatorConstraint);

    userModel = application.get<Model<User>>(getModelToken(User.name));

    await application.init();
  });

  afterAll(async () => {
    await application.close();
    await mongoMemoryServer.stop();
  });

  it('should be defined', () => {
    expect(validatorConstraint).toBeDefined();
  });

  it('has only 1 connection in the `connections` map', () => {
    expect(validatorConstraint['connections'].size).toBe(1);
  });

  describe('validate', () => {
    const userData = [
      { email: 'user-1@email.com', password: 'Passw0rd' },
      { email: 'user-2@email.com', password: 'Passw0rd' },
    ] as const;

    beforeAll(async () => {
      await userModel.create(userData);
    });

    afterAll(async () => {
      await userModel.deleteMany();
    });

    it('throws an `InternalServerErrorException` if the specified connection could not be retrieved', async () => {
      await expect(
        validatorConstraint.validate(userData[0].email, {
          constraints: [
            User,
            'email',
            'WRONG_CONNECTION_NAME',
            ExistenceConstraint.SHOULD_EXIST,
          ],
        } as unknown as ValidationArguments),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws an `InternalServerErrorException` if the `fieldUnderValidation` does not exist on the schema', async () => {
      await expect(
        validatorConstraint.validate(userData[0].email, {
          constraints: [
            User,
            'nonExistentFieldName',
            ConnectionName.DEFAULT,
            ExistenceConstraint.SHOULD_NOT_EXIST,
          ],
        } as unknown as ValidationArguments),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws an `InternalServerErrorException` if the `existenceConstraint` is invalid', async () => {
      await expect(
        validatorConstraint.validate(userData[0].email, {
          constraints: [
            User,
            'email',
            ConnectionName.DEFAULT,
            'invalid-existence-constraint',
          ],
        } as unknown as ValidationArguments),
      ).rejects.toThrow(InternalServerErrorException);
    });

    describe.each<{
      constraint: ExistenceConstraint;
      documentShouldExist: boolean;
    }>([
      {
        constraint: ExistenceConstraint.SHOULD_NOT_EXIST,
        documentShouldExist: false,
      },
      {
        constraint: ExistenceConstraint.SHOULD_EXIST,
        documentShouldExist: true,
      },
    ])(
      'for existence-constraint: $constraint',
      ({ constraint, documentShouldExist }) => {
        it(`returns '${documentShouldExist}' if a document matching the specified criteria exists`, async () => {
          await expect(
            validatorConstraint.validate(userData[0].email, {
              constraints: [User, 'email', ConnectionName.DEFAULT, constraint],
            } as unknown as ValidationArguments),
          ).resolves.toBe(documentShouldExist);
        });

        it(`returns '${!documentShouldExist}' if no document matching the specified criteria exists`, async () => {
          await expect(
            validatorConstraint.validate('non-existent-user@email.com', {
              constraints: [User, 'email', ConnectionName.DEFAULT, constraint],
            } as unknown as ValidationArguments),
          ).resolves.toBe(!documentShouldExist);
        });
      },
    );
  });
});
