import { Module } from '@nestjs/common';
import { CanteenService } from './canteen.service';
import { CanteenResolver } from './canteen.resolver';

@Module({
  providers: [CanteenService, CanteenResolver],
  exports: [CanteenService],
})
export class CanteenModule {}
