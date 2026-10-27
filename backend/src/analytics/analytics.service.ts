import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async getAnalytics() {
    const orders = await this.prisma.order.findMany({
      include: {
        items: { include: { foodItem: true } },
      },
    });

    const totalOrders = orders.length;
    const paidOrCompleted = orders.filter((o) =>
      ([OrderStatus.PAID, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED] as OrderStatus[]).includes(o.status),
    );

    const totalRevenue = paidOrCompleted.reduce((sum, o) => sum + o.totalAmount, 0);

    const completed = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
    const cancelled = orders.filter((o) => o.status === OrderStatus.CANCELLED).length;

    const completionRate = totalOrders > 0 ? Math.round((completed / totalOrders) * 1000) / 10 : 95.0;
    const cancellationRate = totalOrders > 0 ? Math.round((cancelled / totalOrders) * 1000) / 10 : 3.0;

    // Crowd & wait times
    const crowd = await this.queueService.calculateCrowdDensity();

    // Average prep time
    let totalPrepTime = 0;
    let prepCount = 0;
    for (const o of orders) {
      if (o.estimatedPreparationTime) {
        totalPrepTime += o.estimatedPreparationTime;
        prepCount++;
      }
    }
    const averagePreparationTime = prepCount > 0 ? Math.round((totalPrepTime / prepCount) * 10) / 10 : 8.5;

    // Hourly orders aggregation
    const hourBuckets: { [hour: string]: { orders: number; revenue: number } } = {};
    for (let h = 8; h <= 20; h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      hourBuckets[label] = { orders: 0, revenue: 0 };
    }

    orders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      const label = `${h.toString().padStart(2, '0')}:00`;
      if (hourBuckets[label]) {
        hourBuckets[label].orders += 1;
        hourBuckets[label].revenue += o.totalAmount;
      }
    });

    let peakHour = '12:00 - 13:00';
    let maxHourOrders = -1;
    const hourlyOrders = Object.keys(hourBuckets).map((hour) => {
      const count = hourBuckets[hour].orders;
      if (count > maxHourOrders) {
        maxHourOrders = count;
        const hNum = parseInt(hour.slice(0, 2));
        peakHour = `${hNum}:00 – ${(hNum + 1).toString().padStart(2, '0')}:00`;
      }
      return {
        hour,
        orders: hourBuckets[hour].orders,
        revenue: hourBuckets[hour].revenue,
      };
    });

    // Popular foods aggregation
    const foodMap: { [name: string]: { count: number; revenue: number } } = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const name = item.foodItem?.name || 'Item';
        if (!foodMap[name]) foodMap[name] = { count: 0, revenue: 0 };
        foodMap[name].count += item.quantity;
        foodMap[name].revenue += item.subtotal;
      });
    });

    const popularFoods = Object.keys(foodMap)
      .map((name) => ({
        name,
        count: foodMap[name].count,
        revenue: foodMap[name].revenue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageWaitingTime: crowd.estimatedWaitMinutes,
      averagePreparationTime,
      currentCrowdPercentage: crowd.percentage,
      peakHour,
      completionRate,
      cancellationRate,
      hourlyOrders,
      popularFoods,
    };
  }
}
