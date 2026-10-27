import { Resolver, Query, Args } from '@nestjs/graphql';
import { QueueService } from './queue.service';
import { CrowdDensityType, QueueTokenType, QueueStatusType } from '../common/types/graphql.types';
import { PrismaService } from '../prisma/prisma.service';

@Resolver()
export class QueueResolver {
  constructor(
    private queueService: QueueService,
    private prisma: PrismaService,
  ) {}

  @Query(() => CrowdDensityType)
  async getCrowdDensity() {
    return this.queueService.calculateCrowdDensity();
  }

  @Query(() => [QueueTokenType])
  async getCurrentQueue() {
    return this.queueService.getCurrentQueue();
  }

  @Query(() => QueueStatusType, { nullable: true })
  async getQueueStatus(@Args('orderId') orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { token: true },
    });

    if (!order) return null;

    const position = await this.queueService.calculateQueuePosition(orderId);
    const estimatedWait = await this.queueService.calculateWaitingTime(orderId);
    const crowdDensity = await this.queueService.calculateCrowdDensity();

    return {
      queuePosition: position,
      ordersAhead: Math.max(0, position - 1),
      estimatedWaitMinutes: estimatedWait,
      crowdDensity,
      tokenNumber: order.tokenNumber || undefined,
      orderStatus: order.status,
    };
  }
}
