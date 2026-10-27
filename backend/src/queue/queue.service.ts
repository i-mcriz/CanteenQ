import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculates the exact position of an order in the active queue.
   * Active orders are those in PAID, ACCEPTED, or PREPARING status.
   */
  async calculateQueuePosition(orderId: string): Promise<number> {
    const targetOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, createdAt: true, status: true },
    });

    if (!targetOrder || ([OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REJECTED] as OrderStatus[]).includes(targetOrder.status)) {
      return 0;
    }

    // Orders ahead created earlier that are still in active states
    const activeStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
    ];

    const countAhead = await this.prisma.order.count({
      where: {
        status: { in: activeStatuses },
        createdAt: { lt: targetOrder.createdAt },
      },
    });

    return countAhead + 1;
  }

  /**
   * Calculates estimated waiting time in minutes considering:
   * - Orders ahead in queue
   * - Food preparation time of items in the order
   * - Current active preparation orders
   * - Number of active kitchen stations / staff
   * - Current queue load factor
   * - Historical prep performance buffer
   */
  async calculateWaitingTime(orderId: string): Promise<number> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { foodItem: true },
        },
      },
    });

    if (!order) return 0;
    if (order.status === OrderStatus.READY) return 1;
    if (([OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REJECTED] as OrderStatus[]).includes(order.status)) return 0;

    // 1. Calculate this order's max food item preparation time
    const maxItemPrepTime = order.items.reduce((max, item) => {
      return Math.max(max, item.foodItem?.preparationTime || 5);
    }, 5);

    // 2. Orders ahead
    const position = await this.calculateQueuePosition(orderId);
    const ordersAhead = Math.max(0, position - 1);

    // 3. Count available active preparation stations (staff members or default 3)
    const activeStaffCount = await this.prisma.staff.count();
    const preparationStations = Math.max(2, Math.min(6, activeStaffCount));

    // 4. Current active preparation count
    const activePreparingCount = await this.prisma.order.count({
      where: { status: OrderStatus.PREPARING },
    });

    // 5. Queue load multiplier
    const queueLoad = await this.calculateQueueLoad(); // ratio e.g. 0.2 to 1.5

    // Dynamic formula:
    // Base wait: prep time of own order
    // Additional wait: (orders ahead / preparation stations) * average prep slice (approx 3.5 min per slot)
    // Scaled by queue load multiplier
    const throughputRatePerStation = 3.5; // minutes per order per station
    const queueDelay = (ordersAhead / preparationStations) * throughputRatePerStation;
    
    // Historical performance buffer (approx 10-15% variance)
    const historicalBuffer = 1.1;

    let totalEstimated = Math.ceil((maxItemPrepTime + queueDelay) * historicalBuffer * Math.min(1.4, Math.max(0.8, queueLoad)));

    if (order.status === OrderStatus.PREPARING) {
      // If already in preparation, reduce estimated time remaining
      totalEstimated = Math.max(2, Math.round(maxItemPrepTime * 0.6));
    }

    return Math.max(2, totalEstimated);
  }

  /**
   * Computes current canteen crowd density:
   * Active Orders / Canteen Capacity -> Percentage & Tier
   * 0–40%   LOW
   * 41–70%  MODERATE
   * 71–100% HIGH
   */
  async calculateCrowdDensity(): Promise<{
    percentage: number;
    status: 'LOW' | 'MODERATE' | 'HIGH';
    activeOrders: number;
    estimatedWaitMinutes: number;
    queueLength: number;
    canteenCapacity: number;
  }> {
    const canteen = await this.prisma.canteen.findFirst() || { maxCapacity: 50 };
    const capacity = canteen.maxCapacity || 50;

    const activeStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
    ];

    const activeOrders = await this.prisma.order.count({
      where: {
        status: { in: activeStatuses },
      },
    });

    const rawPercentage = (activeOrders / capacity) * 100;
    const percentage = Math.min(100, Math.round(rawPercentage * 10) / 10);

    let status: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
    if (percentage > 70) {
      status = 'HIGH';
    } else if (percentage > 40) {
      status = 'MODERATE';
    }

    // Average queue waiting time
    const avgWait = Math.max(3, Math.round((activeOrders / 3) * 2.5));

    return {
      percentage,
      status,
      activeOrders,
      estimatedWaitMinutes: avgWait,
      queueLength: activeOrders,
      canteenCapacity: capacity,
    };
  }

  /**
   * Calculates overall Queue Load ratio (active orders / threshold)
   */
  async calculateQueueLoad(): Promise<number> {
    const activeStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
    ];

    const activeOrders = await this.prisma.order.count({
      where: { status: { in: activeStatuses } },
    });

    const standardBaseline = 15;
    return Math.max(0.5, activeOrders / standardBaseline);
  }

  /**
   * Returns active queue list
   */
  async getCurrentQueue() {
    return this.prisma.queueToken.findMany({
      where: {
        status: { in: ['ACTIVE', 'SERVING'] },
      },
      include: {
        order: {
          include: {
            student: { include: { user: true } },
            items: { include: { foodItem: true } },
          },
        },
      },
      orderBy: { issuedAt: 'asc' },
    });
  }

  /**
   * Periodic or on-event snapshot recording for analytics
   */
  async recordSnapshot() {
    const crowd = await this.calculateCrowdDensity();
    return this.prisma.queueSnapshot.create({
      data: {
        queueLength: crowd.queueLength,
        activeOrders: crowd.activeOrders,
        averageWaitingTime: crowd.estimatedWaitMinutes,
        crowdPercentage: crowd.percentage,
      },
    });
  }
}
