import { Test, TestingModule } from '@nestjs/testing';
import { HydratedDocument } from 'mongoose';

import { TokenService } from '@/_administration/_authentication/_token/service/token.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/test.helper';

import { UpdateAdministratorDto } from '../dto/update-administrator.dto';
import {
  Administrator,
  AdministratorSchema,
} from '../schema/administrator.schema';
import { AdministratorService } from '../service/administrator.service';
import { AdministratorController } from './administrator.controller';

jest.mock('../service/administrator.service');
jest.mock('@/_administration/_authentication/_token/service/token.service');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(AdministratorController.name, () => {
  const administrator = newDocument<Administrator>(
    Administrator,
    AdministratorSchema,
    {
      username: 'administrator@email.com',
      password: 'P@ssw0rd',
    },
  );

  let loggerService: jest.Mocked<WinstonLoggerService>;
  let administratorService: jest.Mocked<AdministratorService>;
  let administratorController: AdministratorController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdministratorController],
      providers: [WinstonLoggerService, AdministratorService, TokenService],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    administratorService = module.get(AdministratorService);
    administratorController = module.get(AdministratorController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(administratorController).toBeDefined();
  });

  describe('get', () => {
    let currentlyAuthenticatedAdministrator: HydratedDocument<Administrator>;

    beforeEach(() => {
      currentlyAuthenticatedAdministrator =
        administratorController.get(administrator);
    });

    it('returns the authenticated administrator from the request', () => {
      expect(currentlyAuthenticatedAdministrator).toStrictEqual(administrator);
    });

    it('logs data about the authenticated administrator', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Request to get authenticated administrator',
        currentlyAuthenticatedAdministrator,
      );
    });
  });

  describe('update', () => {
    const updateAdministratorDto: UpdateAdministratorDto = {
      email: 'administrator@email.com',
      password: 'P@ssw0rd',
    };
    const updatedUser = administrator
      .$clone()
      .set('username', updateAdministratorDto.email)
      .set('password', updateAdministratorDto.password);

    beforeAll(() => {
      administratorService.update.mockResolvedValue(updatedUser);
    });

    let updateResult: any;

    beforeEach(async () => {
      updateResult = await administratorController.update(
        administrator,
        updateAdministratorDto,
      );
    });

    it('calls `AdministratorService::update`', () => {
      expect(administratorService.update).toHaveBeenCalledTimes(1);
      expect(administratorService.update).toHaveBeenCalledWith(administrator, {
        username: updateAdministratorDto.email,
        password: updateAdministratorDto.password,
      });
    });

    it("returns the updated administrator's data", () => {
      expect(updateResult).toStrictEqual(updatedUser);
    });

    it('logs data about the update request', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Request to update administrator',
        {
          administrator,
          data: updateAdministratorDto,
        },
      );
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await administratorController.delete(administrator);
    });

    it('calls `AdministratorService::delete`', () => {
      expect(administratorService.delete).toHaveBeenCalledTimes(1);
      expect(administratorService.delete).toHaveBeenCalledWith(
        administrator._id,
      );
    });

    it('logs data about the delete request', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Request to delete administrator',
        administrator,
      );
    });
  });
});
