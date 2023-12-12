import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { newDocument } from '@/_library/helper';
import { User, UserSchema } from '@/_user/schema/user.schema';

import { Event } from '../type';
import { EventService } from './event.service';

jest.mock('@nestjs/event-emitter');
jest.mock('@/_application/_logger/service/winston-logger.service');

describe(EventService.name, () => {
  const eventEmitterReturnedValue = true;

  let loggerService: jest.Mocked<WinstonLoggerService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let eventService: EventService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WinstonLoggerService, EventEmitter2, EventService],
    }).compile();

    loggerService = module.get(WinstonLoggerService);
    eventEmitter = module.get(EventEmitter2);
    eventService = module.get(EventService);

    jest.spyOn(eventEmitter, 'emit').mockReturnValue(eventEmitterReturnedValue);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(eventService).toBeDefined();
  });

  describe('emit', () => {
    const event = Event.User.PASSWORD_RESET;
    const user = newDocument<User>(User, UserSchema, {
      email: 'user@email.com',
      password: 'P@ssw0rd',
    });

    let result: boolean;

    beforeEach(() => {
      result = eventService.emit(event, user);
    });

    it('calls `WinstonLoggerService::log` with the passed in event & payload', () => {
      expect(loggerService.log).toHaveBeenCalledTimes(1);
      expect(loggerService.log).toHaveBeenCalledWith('Emitting event', {
        event: event.description,
        payload: [user],
      });
    });

    it('calls `EventEmitter2::emit` with the passed-in arguments', () => {
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith(event, user);
    });

    it('returns the value returned by `EventEmitter2::emit`', () => {
      expect(result).toBe(eventEmitterReturnedValue);
    });
  });
});
