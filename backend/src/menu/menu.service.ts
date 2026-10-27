import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FoodItemInput } from '../common/types/graphql.types';
import { QueueGateway } from '../queue/queue.gateway';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private queueGateway: QueueGateway,
  ) {}

  async getMenu(params?: {
    categoryId?: string;
    search?: string;
    isVeg?: boolean;
    isAvailable?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }) {
    const where: any = {};

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params?.search && params.search.trim() !== '') {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.isVeg !== undefined) {
      where.isVeg = params.isVeg;
    }

    if (params?.isAvailable !== undefined) {
      where.isAvailable = params.isAvailable;
    }

    if (params?.minPrice !== undefined || params?.maxPrice !== undefined) {
      where.price = {};
      if (params.minPrice !== undefined) where.price.gte = params.minPrice;
      if (params.maxPrice !== undefined) where.price.lte = params.maxPrice;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (params?.sortBy === 'PRICE_LOW_HIGH') orderBy = { price: 'asc' };
    if (params?.sortBy === 'PRICE_HIGH_LOW') orderBy = { price: 'desc' };
    if (params?.sortBy === 'RATING') orderBy = { rating: 'desc' };
    if (params?.sortBy === 'PREP_TIME') orderBy = { preparationTime: 'asc' };

    return this.prisma.foodItem.findMany({
      where,
      orderBy,
      include: {
        category: true,
      },
    });
  }

  async getFoodItem(id: string) {
    const item = await this.prisma.foodItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Food item with ID ${id} not found`);
    }

    return item;
  }

  async updateFoodAvailability(
    id: string,
    isAvailable: boolean,
    stockQuantity?: number,
    preparationTime?: number,
  ) {
    const existing = await this.getFoodItem(id);

    const updated = await this.prisma.foodItem.update({
      where: { id },
      data: {
        isAvailable,
        ...(stockQuantity !== undefined ? { stockQuantity } : {}),
        ...(preparationTime !== undefined ? { preparationTime } : {}),
      },
      include: { category: true },
    });

    this.queueGateway.broadcastFoodAvailability({
      foodItemId: updated.id,
      name: updated.name,
      isAvailable: updated.isAvailable,
      stockQuantity: updated.stockQuantity,
      preparationTime: updated.preparationTime,
    });

    return updated;
  }

  async createFoodItem(input: FoodItemInput) {
    return this.prisma.foodItem.create({
      data: input,
      include: { category: true },
    });
  }

  async updateFoodItem(id: string, input: FoodItemInput) {
    const updated = await this.prisma.foodItem.update({
      where: { id },
      data: input,
      include: { category: true },
    });

    this.queueGateway.broadcastFoodAvailability({
      foodItemId: updated.id,
      name: updated.name,
      isAvailable: updated.isAvailable,
      stockQuantity: updated.stockQuantity,
      preparationTime: updated.preparationTime,
    });

    return updated;
  }

  async deleteFoodItem(id: string) {
    await this.prisma.foodItem.delete({
      where: { id },
    });
    return true;
  }
}
