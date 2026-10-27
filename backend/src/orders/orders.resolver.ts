import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { OrderType } from '../common/types/graphql.types';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, OrderStatus } from '@prisma/client';

@Resolver(() => OrderType)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  @Query(() => OrderType)
  async getOrder(@Args('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  @Query(() => [OrderType])
  @UseGuards(GqlAuthGuard)
  async getMyOrders(@CurrentUser() user: any) {
    if (!user.student?.id) {
      throw new UnauthorizedException('Only students have personal order histories');
    }
    return this.ordersService.getMyOrders(user.student.id);
  }

  @Query(() => [OrderType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN, Role.COLLEGE_ADMIN)
  async getAllOrders(
    @Args('status', { type: () => OrderStatus, nullable: true }) status?: OrderStatus,
  ) {
    return this.ordersService.getAllOrders(status);
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard)
  async createOrder(
    @CurrentUser() user: any,
    @Args('paymentMethod', { defaultValue: 'UPI' }) paymentMethod: string,
  ) {
    if (!user.student?.id) {
      throw new UnauthorizedException('Only students can place orders');
    }
    return this.ordersService.createOrder(user.student.id, paymentMethod);
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN, Role.COLLEGE_ADMIN)
  async acceptOrder(@Args('orderId') orderId: string) {
    return this.ordersService.acceptOrder(orderId);
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN, Role.COLLEGE_ADMIN)
  async startPreparing(@Args('orderId') orderId: string) {
    return this.ordersService.startPreparing(orderId);
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN, Role.COLLEGE_ADMIN)
  async markReady(@Args('orderId') orderId: string) {
    return this.ordersService.markReady(orderId);
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN, Role.COLLEGE_ADMIN)
  async completeOrder(@Args('orderId') orderId: string) {
    return this.ordersService.completeOrder(orderId);
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN, Role.COLLEGE_ADMIN)
  async cancelOrder(
    @Args('orderId') orderId: string,
    @Args('reason', { nullable: true }) reason?: string,
  ) {
    return this.ordersService.cancelOrder(orderId, reason);
  }
}
