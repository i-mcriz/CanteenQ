import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { PaymentService } from './payment.service';
import { PaymentPayloadType, PaymentVerificationType } from '../common/types/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver()
export class PaymentResolver {
  constructor(private paymentService: PaymentService) {}

  @Mutation(() => PaymentPayloadType)
  @UseGuards(GqlAuthGuard)
  async createPayment(
    @Args('orderId') orderId: string,
    @Args('paymentMethod', { defaultValue: 'UPI' }) paymentMethod: string,
  ) {
    return this.paymentService.createPayment(orderId, paymentMethod);
  }

  @Mutation(() => PaymentVerificationType)
  @UseGuards(GqlAuthGuard)
  async verifyPayment(
    @Args('orderId') orderId: string,
    @Args('transactionId', { nullable: true }) transactionId?: string,
    @Args('signature', { nullable: true }) signature?: string,
  ) {
    return this.paymentService.verifyPayment(orderId, transactionId, signature);
  }
}
