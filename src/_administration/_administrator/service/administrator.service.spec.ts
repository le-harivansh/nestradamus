import {
  BadRequestException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { verify } from 'argon2';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { HydratedDocument, Types } from 'mongoose';
import { Model } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import {
  Administrator,
  AdministratorSchema,
} from '../schema/administrator.schema';
import { AdministratorService } from './administrator.service';

jest.mock('@/_application/_logger/service/winston-logger.service');

describe(AdministratorService.name, () => {
  let application: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;

  let loggerService: jest.Mocked<WinstonLoggerService>;
  let administratorService: AdministratorService;

  let administratorModel: Model<Administrator>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          async useFactory() {
            mongoMemoryServer = await MongoMemoryServer.create();

            return { uri: mongoMemoryServer.getUri() };
          },
        }),
        MongooseModule.forFeature([
          { name: Administrator.name, schema: AdministratorSchema },
        ]),
      ],
      providers: [WinstonLoggerService, AdministratorService],
    }).compile();

    application = moduleFixture.createNestApplication();
    loggerService = application.get(WinstonLoggerService);
    administratorService = application.get(AdministratorService);

    administratorModel = application.get<Model<Administrator>>(
      getModelToken(Administrator.name),
    );

    await application.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();

    await administratorModel.deleteMany();
  });

  afterAll(async () => {
    await application.close();
    await mongoMemoryServer.stop();
  });

  it('should be defined', () => {
    expect(administratorService).toBeDefined();
  });

  describe('create', () => {
    const administratorData: Administrator = {
      username: 'administrator@email.com',
      password: 'P@ssw0rd',
    };

    let newAdministrator: HydratedDocument<Administrator>;

    beforeEach(async () => {
      newAdministrator = await administratorService.create(administratorData);
    });

    it("saves the provided administrator's data to the database", async () => {
      await expect(
        administratorModel
          .findOne({ username: administratorData.username })
          .exec(),
      ).resolves.toMatchObject({
        username: administratorData.username,
        password: expect.any(String),
      });
    });

    it("hashes the administrator's password before saving it to the database", async () => {
      const retrievedAdministrator = await administratorModel
        .findOne({ username: administratorData.username })
        .exec();

      await expect(
        verify(
          retrievedAdministrator!.get('password'),
          administratorData.password,
        ),
      ).resolves.toBeTruthy();
    });

    it('logs data about the newly created administrator', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Created administrator',
        newAdministrator,
      );
    });

    it('returns the newly created administrator document', () => {
      expect(newAdministrator).toMatchObject({
        username: administratorData.username,
        password: expect.any(String),
      });
    });
  });

  describe('findOne', () => {
    const administratorData: Administrator = {
      username: 'administrator@email.com',
      password: 'P@ssw0rd',
    };

    let administratorId: Types.ObjectId;

    beforeEach(async () => {
      administratorId = (await administratorModel.create(administratorData))
        ._id;

      jest.clearAllMocks();
    });

    it.each([
      { getCriteria: () => administratorId },
      { getCriteria: () => ({ username: administratorData.username }) },
    ] as const)(
      'returns the corresponding administrator from the database',
      async ({ getCriteria }) => {
        const retrievedAdministrator = await administratorService.findOne(
          getCriteria(),
        );

        expect(retrievedAdministrator).toMatchObject({
          ...administratorData,
          password: expect.any(String), // the administrator's password is hashed before it is saved to the database.
        });
      },
    );

    it('throws a `NotFoundException` if the administrator could not be found in the database', async () => {
      await expect(
        administratorService.findOne(new Types.ObjectId()),
      ).rejects.toThrow(NotFoundException);
    });

    it('logs data about the queried administrator', async () => {
      const retrievedAdministrator =
        await administratorService.findOne(administratorId);

      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Queried administrator',
        retrievedAdministrator,
      );
    });
  });

  describe('update', () => {
    const administratorData: Administrator = {
      username: 'administrator@email.com',
      password: 'P@ssw0rd',
    };

    let administrator: HydratedDocument<Administrator>;

    beforeEach(async () => {
      administrator = await administratorModel.create(administratorData);
    });

    describe.each([
      { type: 'Document', getCriteria: () => administrator },
      {
        type: 'username',
        getCriteria: () => ({ username: administratorData.username }),
      },
    ])('- with `$type`', ({ getCriteria }) => {
      it("updates the specified administrator's data using the provided payload [without-password]", async () => {
        const newUsername = 'new-email@administrator.com';

        await administratorService.update(getCriteria(), {
          username: newUsername,
        });

        await expect(
          administratorModel.findById(administrator._id).exec(),
        ).resolves.toMatchObject({
          username: newUsername,
        });
      });

      it('hashes any provided administrator-password before updating it', async () => {
        const newPassword = 'password-1111';

        await administratorService.update(getCriteria(), {
          password: newPassword,
        });

        const savedHashedPassword = (await administratorModel
          .findById(administrator)
          .exec())!.password;

        await expect(
          verify(savedHashedPassword, newPassword),
        ).resolves.toBeTruthy();
      });

      it('will not re-hash the password if it has not been updated', async () => {
        const newEmail = 'new-administrator@email.com';

        await administratorService.update(getCriteria(), {
          username: newEmail,
        });

        const savedHashedPassword = (await administratorModel
          .findById(administrator)
          .exec())!.password;

        await expect(
          verify(savedHashedPassword, administratorData.password),
        ).resolves.toBeTruthy();
      });

      it("updates the specified administrator's data using the provided payload [with-password]", async () => {
        const newAdministratorData: Administrator = {
          username: 'new-administrator@email.com',
          password: 'new-P@ssw0rd',
        };

        await administratorService.update(getCriteria(), newAdministratorData);

        const updatedAdministrator = await administratorModel
          .findById(administrator)
          .exec();

        expect(updatedAdministrator).toMatchObject({
          ...newAdministratorData,
          password: expect.any(String),
        });

        await expect(
          verify(
            updatedAdministrator!.get('password'),
            newAdministratorData.password,
          ),
        ).resolves.toBeTruthy();
      });
    });

    it('throws a `NotFoundException` if the administrator to update could not be found in the database', async () => {
      await expect(
        administratorService.update(new Types.ObjectId(), {
          username: 'new-administrator@email.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('logs data about the updated administrator', async () => {
      const updatedAdministrator = await administratorService.update(
        { username: administratorData.username },
        { username: 'updated-administrator@email.com' },
      );

      expect(loggerService.log).toHaveBeenCalledTimes(2);
      expect(loggerService.log).toHaveBeenLastCalledWith(
        'Updated administrator',
        updatedAdministrator,
      );
    });
  });

  describe('delete', () => {
    const administratorData: Administrator = {
      username: 'administrator@email.com',
      password: 'P@ssw0rd',
    };

    let administratorId: Types.ObjectId;

    beforeEach(async () => {
      administratorId = (await administratorModel.create(administratorData))
        ._id;
    });

    it("removes the specified administrator's data from the database", async () => {
      await administratorService.delete(administratorId);

      const nonExistentAdministrator = await administratorModel
        .findById(administratorId)
        .exec();

      expect(nonExistentAdministrator).toBeNull();
    });

    it('throws a `BadRequestException` if the `deletedCount` is 0.', async () => {
      await expect(
        administratorService.delete(new Types.ObjectId()),
      ).rejects.toThrow(BadRequestException);
    });

    it('logs data about the deleted administrator', async () => {
      await administratorService.delete(administratorId);

      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith('Deleted administrator', {
        id: administratorId,
      });
    });
  });
});
