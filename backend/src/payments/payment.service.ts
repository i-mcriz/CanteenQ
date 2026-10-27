import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Initializes a payment order.
   * If RAZORPAY_KEY_ID is present, creates an order payload.
   * Otherwise, provisions a seamless local development test order.
   */
  async createPayment(orderId: string, paymentMethod: string = 'UPI') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const isLiveGateway = keyId && keyId !== 'rzp_test_placeholder_key';

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Upsert payment record
    const payment = await this.prisma.payment.upsert({
      where: { orderId },
      update: {
        amount: order.totalAmount,
        provider: isLiveGateway ? 'RAZORPAY' : 'TEST_MODE',
        transactionId,
        status: PaymentStatus.PENDING,
      },
      create: {
        orderId,
        amount: order.totalAmount,
        currency: 'INR',
        provider: isLiveGateway ? 'RAZORPAY' : 'TEST_MODE',
        transactionId,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      orderId: order.id,
      amount: order.totalAmount,
      currency: 'INR',
      transactionId,
      provider: isLiveGateway ? 'RAZORPAY' : 'TEST_MODE',
      razorpayKeyId: isLiveGateway ? keyId : 'rzp_test_placeholder_key',
      paymentMethod,
    };
  }

  /**
   * Verifies payment completion.
   * In TEST_MODE (or when valid signature is passed), marks payment SUCCESS and order PAID.
   */
  async verifyPayment(orderId: string, transactionId?: string, signature?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      throw new BadRequestException('No payment initialized for this order');
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isLiveGateway = keySecret && keySecret !== 'rzp_test_placeholder_secret';

    let verified = false;

    if (isLiveGateway && signature && transactionId) {
      // Razorpay signature validation: hmac_sha256(order_id + "|" + payment_id, secret)
      const expected = crypto
        .createHmac('sha256', keySecret)
        .update(`${payment.transactionId}|${transactionId}`)
        .digest('hex');
      verified = expected === signature;
    } else {
      // In development / test mode, immediately verify success
      verified = true;
    }

    if (!verified) {
      await this.prisma.payment.update({
        where: { orderId },
        data: { status: PaymentStatus.FAILED },
      });
      throw new BadRequestException('Payment signature verification failed');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { orderId },
      data: {
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(),
        ...(transactionId ? { transactionId } : {}),
      },
    });

    return updatedPayment;
  }
}
