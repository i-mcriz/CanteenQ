import { Module } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { PredictionResolver } from './prediction.resolver';

@Module({
  providers: [PredictionService, PredictionResolver],
  exports: [PredictionService],
})
export class PredictionModule {}
