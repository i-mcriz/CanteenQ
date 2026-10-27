import { Module, Global } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueResolver } from './queue.resolver';
import { QueueGateway } from './queue.gateway';

@Global()
@Module({
  providers: [QueueService, QueueResolver, QueueGateway],
  exports: [QueueService, QueueGateway],
})
export class QueueModule {}
