import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PredictionModule } from '../predictions/prediction.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [UsersModule, AnalyticsModule, PredictionModule, ReportsModule],
  exports: [UsersModule, AnalyticsModule, PredictionModule, ReportsModule],
})
export class AdminModule {}
