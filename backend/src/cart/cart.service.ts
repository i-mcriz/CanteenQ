import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCart(studentId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { studentId },
      include: {
        items: {
          include: {
            foodItem: { include: { category: true } },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          studentId,
          totalAmount: 0,
        },
        include: {
          items: {
            include: {
              foodItem: { include: { category: true } },
            },
          },
        },
      });
    }

    return cart;
  }

  private async recalculateCartTotal(cartId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
    });

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    return this.prisma.cart.update({
      where: { id: cartId },
      data: { totalAmount },
      include: {
        items: {
          include: {
            foodItem: { include: { category: true } },
          },
        },
      },
    });
  }

  async getCart(studentId: string) {
    return this.getOrCreateCart(studentId);
  }

  async addToCart(studentId: string, foodItemId: string, quantity: number = 1) {
    let foodItem = await this.prisma.foodItem.findUnique({
      where: { id: foodItemId },
    });

    if (!foodItem) {
      foodItem = await this.prisma.foodItem.findFirst({
        where: { isAvailable: true },
      });
    }

    if (!foodItem) {
      throw new NotFoundException('Food item not found');
    }

    if (!foodItem.isAvailable || foodItem.stockQuantity <= 0) {
      throw new BadRequestException('This item is currently sold out');
    }

    const cart = await this.getOrCreateCart(studentId);

    const existingItem = cart.items.find((item) => item.foodItemId === foodItemId);

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
          subtotal: newQty * foodItem.price,
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          foodItemId,
          quantity,
          unitPrice: foodItem.price,
          subtotal: quantity * foodItem.price,
        },
      });
    }

    return this.recalculateCartTotal(cart.id);
  }

  async updateCart(studentId: string, foodItemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(studentId);

    if (quantity <= 0) {
      return this.removeFromCart(studentId, foodItemId);
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, foodItemId },
    });

    if (!item) {
      return this.addToCart(studentId, foodItemId, quantity);
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: {
        quantity,
        subtotal: quantity * item.unitPrice,
      },
    });

    return this.recalculateCartTotal(cart.id);
  }

  async removeFromCart(studentId: string, foodItemId: string) {
    const cart = await this.getOrCreateCart(studentId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, foodItemId },
    });

    return this.recalculateCartTotal(cart.id);
  }

  async clearCart(studentId: string) {
    const cart = await this.getOrCreateCart(studentId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.prisma.cart.update({
      where: { id: cart.id },
      data: { totalAmount: 0 },
      include: {
        items: {
          include: {
            foodItem: { include: { category: true } },
          },
        },
      },
    });
  }
}
