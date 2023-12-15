import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { UserDocument } from '@/_user/_user/schema/user.schema';

import { Event } from '../type';

@Injectable()
export class EventService {
  constructor(
    private readonly emitter: EventEmitter2,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(EventService.name);
  }

  emit(
    event: (typeof Event)['User'][keyof (typeof Event)['User']],
    user: UserDocument,
  ): boolean;
  emit(event: symbol, ...payload: unknown[]): boolean {
    this.loggerService.log('Emitting event', {
      event: event.description,
      payload,
    });

    return this.emitter.emit(event, ...payload);
  }
}
