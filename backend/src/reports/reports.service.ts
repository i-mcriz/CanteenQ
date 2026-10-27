import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async getReportSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: today },
      },
    });

    const totalOrdersToday = ordersToday.length;
    const totalRevenueToday = ordersToday.reduce((sum, o) => sum + o.totalAmount, 0);
    const crowd = await this.queueService.calculateCrowdDensity();

    return {
      generatedAt: new Date(),
      totalOrdersToday,
      totalRevenueToday: Math.round(totalRevenueToday * 100) / 100,
      averageWaitTimeToday: crowd.estimatedWaitMinutes,
      activeQueueLength: crowd.queueLength,
      systemHealth: 'OPTIMAL',
    };
  }
}
