import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

@Injectable()
export class EventService {
  constructor(
    private readonly emitter: EventEmitter2,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(EventService.name);
  }

  emit(event: string | symbol, ...payload: unknown[]): boolean {
    this.loggerService.log('Emitting event', {
      event: typeof event === 'symbol' ? event.description : event,
      payload,
    });

    return this.emitter.emit(event, ...payload);
  }
}
