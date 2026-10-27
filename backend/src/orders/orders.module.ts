import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { TokenModule } from '../tokens/token.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [TokenModule, NotificationModule],
  providers: [OrdersService, OrdersResolver],
  exports: [OrdersService],
})
export class OrdersModule {}
