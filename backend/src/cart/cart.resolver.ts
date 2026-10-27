import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { CartType } from '../common/types/graphql.types';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => CartType)
export class CartResolver {
  constructor(private cartService: CartService) {}

  @Query(() => CartType)
  @UseGuards(GqlAuthGuard)
  async getCart(@CurrentUser() user: any) {
    if (!user.student?.id) {
      throw new UnauthorizedException('Only registered students have an active cart');
    }
    return this.cartService.getCart(user.student.id);
  }

  @Mutation(() => CartType)
  @UseGuards(GqlAuthGuard)
  async addToCart(
    @CurrentUser() user: any,
    @Args('foodItemId') foodItemId: string,
    @Args('quantity', { type: () => Int, defaultValue: 1 }) quantity: number,
  ) {
    if (!user.student?.id) {
      throw new UnauthorizedException('Only registered students can add items to cart');
    }
    return this.cartService.addToCart(user.student.id, foodItemId, quantity);
  }

  @Mutation(() => CartType)
  @UseGuards(GqlAuthGuard)
  async updateCart(
    @CurrentUser() user: any,
    @Args('foodItemId') foodItemId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
  ) {
    if (!user.student?.id) {
      throw new UnauthorizedException('Only registered students can update cart');
    }
    return this.cartService.updateCart(user.student.id, foodItemId, quantity);
  }

  @Mutation(() => CartType)
  @UseGuards(GqlAuthGuard)
  async removeFromCart(
    @CurrentUser() user: any,
    @Args('foodItemId') foodItemId: string,
  ) {
    if (!user.student?.id) {
      throw new UnauthorizedException('Only registered students can remove items from cart');
    }
    return this.cartService.removeFromCart(user.student.id, foodItemId);
  }

  @Mutation(() => CartType)
  @UseGuards(GqlAuthGuard)
  async clearCart(@CurrentUser() user: any) {
    if (!user.student?.id) {
      throw new UnauthorizedException('Only registered students can clear cart');
    }
    return this.cartService.clearCart(user.student.id);
  }
}
