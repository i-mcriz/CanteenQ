import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../tokens/token.service';
import { QueueService } from '../queue/queue.service';
import { QueueGateway } from '../queue/queue.gateway';
import { NotificationService } from '../notifications/notification.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private queueService: QueueService,
    private queueGateway: QueueGateway,
    private notificationService: NotificationService,
  ) {}

  async createOrder(studentId: string, paymentMethod: string = 'UPI') {
    const cart = await this.prisma.cart.findUnique({
      where: { studentId },
      include: {
        items: {
          include: { foodItem: true },
        },
        student: { include: { user: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty. Add food items first.');
    }

    // Verify stock availability
    for (const item of cart.items) {
      if (!item.foodItem.isAvailable || item.foodItem.stockQuantity < item.quantity) {
        throw new BadRequestException(`"${item.foodItem.name}" is out of stock or insufficient quantity.`);
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = subtotal + tax;

    const tokenNumber = await this.tokenService.generateNextToken();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const maxPrepTime = cart.items.reduce((max, item) => Math.max(max, item.foodItem.preparationTime), 8);

    // Create order transaction with cloud latency tolerance
    const order = await this.prisma.$transaction(
      async (tx) => {
        // 1. Decrement stock
        for (const item of cart.items) {
          const newStock = Math.max(0, item.foodItem.stockQuantity - item.quantity);
          await tx.foodItem.update({
            where: { id: item.foodItemId },
            data: {
              stockQuantity: newStock,
              isAvailable: newStock > 0,
            },
          });
        }

        // 2. Create order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            studentId,
            tokenNumber,
            status: OrderStatus.PAID,
            paymentStatus: PaymentStatus.SUCCESS,
            paymentMethod,
            subtotal,
            tax,
            totalAmount,
            estimatedPreparationTime: maxPrepTime,
            createdAt: new Date(),
            items: {
              create: cart.items.map((item) => ({
                foodItemId: item.foodItemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              })),
            },
          },
        });

        // 3. Generate QR verification
        const qrCode = this.tokenService.generateQrVerificationCode(tokenNumber, newOrder.id);
        await tx.order.update({
          where: { id: newOrder.id },
          data: { qrVerificationCode: qrCode },
        });

        // 4. Create QueueToken
        await tx.queueToken.create({
          data: {
            tokenNumber,
            orderId: newOrder.id,
            position: 1,
            status: 'ACTIVE',
            estimatedWaitTime: maxPrepTime + 4,
          },
        });

        // 5. Clear cart
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
        await tx.cart.update({
          where: { id: cart.id },
          data: { totalAmount: 0 },
        });

        return newOrder;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );

    // Post-creation calculations
    const position = await this.queueService.calculateQueuePosition(order.id);
    const waitingTime = await this.queueService.calculateWaitingTime(order.id);

    const finalizedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        queuePosition: position,
        estimatedWaitingTime: waitingTime,
      },
      include: {
        items: { include: { foodItem: { include: { category: true } } } },
        token: true,
        student: { include: { user: true } },
      },
    });

    // Notify student
    if (cart.student?.user?.id) {
      await this.notificationService.createNotification({
        userId: cart.student.user.id,
        title: `Order Placed: ${tokenNumber}`,
        message: `Your digital token is ${tokenNumber}. Queue position: #${position}. Estimated wait: ~${waitingTime} min.`,
        type: 'ORDER_PLACED',
      });
    }

    // Broadcast real-time updates
    const crowd = await this.queueService.calculateCrowdDensity();
    this.queueGateway.broadcastCrowdDensity(crowd);
    this.queueGateway.broadcastQueueUpdate({ orderId: finalizedOrder.id, position, tokenNumber });
    this.queueGateway.broadcastOrderStatus(finalizedOrder.id, finalizedOrder);

    return finalizedOrder;
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { foodItem: { include: { category: true } } } },
        token: true,
        student: { include: { user: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    const position = await this.queueService.calculateQueuePosition(order.id);
    const estimatedWait = await this.queueService.calculateWaitingTime(order.id);

    return {
      ...order,
      queuePosition: position,
      estimatedWaitingTime: estimatedWait,
    };
  }

  async getMyOrders(studentId: string) {
    const orders = await this.prisma.order.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { foodItem: { include: { category: true } } } },
        token: true,
      },
    });

    return Promise.all(
      orders.map(async (o) => {
        const queuePos = await this.queueService.calculateQueuePosition(o.id);
        const waitTime = await this.queueService.calculateWaitingTime(o.id);
        return {
          ...o,
          queuePosition: queuePos,
          estimatedWaitingTime: waitTime,
        };
      }),
    );
  }

  async getAllOrders(status?: OrderStatus) {
    const where = status ? { status } : {};
    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { foodItem: { include: { category: true } } } },
        token: true,
        student: { include: { user: true } },
      },
      take: 100,
    });

    return Promise.all(
      orders.map(async (o) => {
        const queuePos = await this.queueService.calculateQueuePosition(o.id);
        const waitTime = await this.queueService.calculateWaitingTime(o.id);
        return {
          ...o,
          queuePosition: queuePos,
          estimatedWaitingTime: waitTime,
        };
      }),
    );
  }

  async acceptOrder(orderId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: {
        student: { include: { user: true } },
        token: true,
        items: { include: { foodItem: true } },
      },
    });

    if (order.student?.user?.id) {
      await this.notificationService.createNotification({
        userId: order.student.user.id,
        title: `Order Accepted: ${order.tokenNumber}`,
        message: `Your order has been accepted by the kitchen staff and will be prepared soon.`,
        type: 'ORDER_ACCEPTED',
      });
    }

    this.broadcastOrderChange(order);
    return order;
  }

  async startPreparing(orderId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PREPARING,
        preparingAt: new Date(),
      },
      include: {
        student: { include: { user: true } },
        token: true,
        items: { include: { foodItem: true } },
      },
    });

    if (order.student?.user?.id) {
      await this.notificationService.createNotification({
        userId: order.student.user.id,
        title: `Food in Preparation: ${order.tokenNumber}`,
        message: `Your order is now on the prep station! Almost there.`,
        type: 'ORDER_PREPARING',
      });
    }

    this.broadcastOrderChange(order);
    return order;
  }

  async markReady(orderId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.READY,
        readyAt: new Date(),
      },
      include: {
        student: { include: { user: true } },
        token: true,
        items: { include: { foodItem: true } },
      },
    });

    if (order.token) {
      await this.prisma.queueToken.update({
        where: { id: order.token.id },
        data: { status: 'SERVING' },
      });
    }

    if (order.student?.user?.id) {
      await this.notificationService.createNotification({
        userId: order.student.user.id,
        title: `🔔 ORDER READY FOR PICKUP: ${order.tokenNumber}`,
        message: `Your order is hot and ready at the counter! Please present your QR code for pickup.`,
        type: 'ORDER_READY',
      });
    }

    this.broadcastOrderChange(order);
    return order;
  }

  async completeOrder(orderId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        student: { include: { user: true } },
        token: true,
        items: { include: { foodItem: true } },
      },
    });

    if (order.token) {
      await this.prisma.queueToken.update({
        where: { id: order.token.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    if (order.student?.user?.id) {
      await this.notificationService.createNotification({
        userId: order.student.user.id,
        title: `Order Completed: ${order.tokenNumber}`,
        message: `Thank you for ordering with CanteenQ. Enjoy your meal!`,
        type: 'ORDER_COMPLETED',
      });
    }

    this.broadcastOrderChange(order);
    return order;
  }

  async cancelOrder(orderId: string, reason?: string) {
    const current = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, student: { include: { user: true } }, token: true },
    });

    if (!current) throw new NotFoundException('Order not found');

    // Restore stock
    for (const item of current.items) {
      await this.prisma.foodItem.update({
        where: { id: item.foodItemId },
        data: {
          stockQuantity: { increment: item.quantity },
          isAvailable: true,
        },
      });
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: {
        student: { include: { user: true } },
        token: true,
        items: { include: { foodItem: true } },
      },
    });

    if (order.token) {
      await this.prisma.queueToken.update({
        where: { id: order.token.id },
        data: { status: 'CANCELLED' },
      });
    }

    if (order.student?.user?.id) {
      await this.notificationService.createNotification({
        userId: order.student.user.id,
        title: `Order Cancelled: ${order.tokenNumber}`,
        message: `Your order was cancelled. ${reason ? `Reason: ${reason}` : ''}`,
        type: 'ORDER_CANCELLED',
      });
    }

    this.broadcastOrderChange(order);
    return order;
  }

  private async broadcastOrderChange(order: any) {
    this.queueGateway.broadcastOrderStatus(order.id, order);
    const crowd = await this.queueService.calculateCrowdDensity();
    this.queueGateway.broadcastCrowdDensity(crowd);
    this.queueGateway.broadcastQueueUpdate({ orderId: order.id, status: order.status });
  }
}
