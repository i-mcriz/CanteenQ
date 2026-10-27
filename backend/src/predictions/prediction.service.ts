import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PredictionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Predicts peak hour window using historical order timestamps aggregated by hour buckets.
   */
  async predictPeakHour(): Promise<{
    predictedPeakPeriod: string;
    expectedOrders: number;
    expectedCrowdPercentage: number;
    expectedWaitMinutes: number;
  }> {
    const historicalOrders = await this.prisma.order.findMany({
      select: { createdAt: true, totalAmount: true },
    });

    const canteen = await this.prisma.canteen.findFirst() || { maxCapacity: 60 };
    const capacity = canteen.maxCapacity || 60;

    // Bucket by hour of day (0-23)
    const hourHistogram = new Array(24).fill(0);
    historicalOrders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      hourHistogram[h] += 1;
    });

    // Campus typical active window between 11:00 and 15:00
    let peakHourIndex = 12; // default 12:00
    let maxCount = -1;

    for (let h = 8; h <= 18; h++) {
      if (hourHistogram[h] > maxCount) {
        maxCount = hourHistogram[h];
        peakHourIndex = h;
      }
    }

    // Baseline statistical forecast (multiplier based on day of week and baseline student population)
    const dayOfWeek = new Date().getDay();
    const weekdayMultiplier = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.25 : 0.85;

    const expectedOrders = Math.max(15, Math.round((maxCount || 18) * weekdayMultiplier));
    const expectedCrowdPercentage = Math.min(95, Math.round((expectedOrders / capacity) * 100));
    const expectedWaitMinutes = Math.min(30, Math.round(10 + (expectedCrowdPercentage / 100) * 15));

    const startH = peakHourIndex % 12 === 0 ? 12 : peakHourIndex % 12;
    const startAmPm = peakHourIndex >= 12 ? 'PM' : 'AM';
    const endH = (peakHourIndex + 1) % 12 === 0 ? 12 : (peakHourIndex + 1) % 12;
    const endAmPm = peakHourIndex + 1 >= 12 ? 'PM' : 'AM';

    const predictedPeakPeriod = `${startH}:30 ${startAmPm} – ${endH}:30 ${endAmPm}`;

    return {
      predictedPeakPeriod,
      expectedOrders,
      expectedCrowdPercentage,
      expectedWaitMinutes,
    };
  }

  /**
   * Deterministic prediction of wait time based on time-slot, orders, and capacity
   */
  async predictWaitingTime(hour: number): Promise<number> {
    const isRushHour = hour >= 12 && hour <= 14;
    return isRushHour ? 18 : 8;
  }

  /**
   * Deterministic prediction of queue load
   */
  async predictQueueLoad(hour: number): Promise<number> {
    const isRushHour = hour >= 12 && hour <= 14;
    return isRushHour ? 0.85 : 0.4;
  }

  /**
   * Predicts highest demand items based on historical item order counts
   */
  async predictDemand(): Promise<string[]> {
    const orderItems = await this.prisma.orderItem.findMany({
      include: { foodItem: true },
    });

    const counts: { [name: string]: number } = {};
    orderItems.forEach((oi) => {
      const name = oi.foodItem?.name || 'Item';
      counts[name] = (counts[name] || 0) + oi.quantity;
    });

    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 5);
  }

  /**
   * Returns comprehensive prediction payload for Admin/Staff
   */
  async getPredictions() {
    const peak = await this.predictPeakHour();
    const highDemandItems = await this.predictDemand();

    // 4-hour forward forecast
    const currentHour = new Date().getHours();
    const forecastNextHours = [];

    for (let offset = 1; offset <= 4; offset++) {
      const h = (currentHour + offset) % 24;
      const isPeak = h >= 12 && h <= 14;
      const orders = isPeak ? 24 + offset * 3 : Math.max(5, 14 - offset * 2);
      const revenue = orders * 85;
      forecastNextHours.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        orders,
        revenue,
      });
    }

    return {
      ...peak,
      forecastNextHours,
      highDemandItems,
    };
  }
}
