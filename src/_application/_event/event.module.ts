import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { EventService } from './service/event.service';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
