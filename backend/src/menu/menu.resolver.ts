import { Resolver, Query, Mutation, Args, Float, Int } from '@nestjs/graphql';
import { MenuService } from './menu.service';
import { FoodItemType, FoodItemInput } from '../common/types/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => FoodItemType)
export class MenuResolver {
  constructor(private menuService: MenuService) {}

  @Query(() => [FoodItemType])
  async getMenu(
    @Args('categoryId', { nullable: true }) categoryId?: string,
    @Args('search', { nullable: true }) search?: string,
    @Args('isVeg', { nullable: true }) isVeg?: boolean,
    @Args('isAvailable', { nullable: true }) isAvailable?: boolean,
    @Args('minPrice', { type: () => Float, nullable: true }) minPrice?: number,
    @Args('maxPrice', { type: () => Float, nullable: true }) maxPrice?: number,
    @Args('sortBy', { nullable: true }) sortBy?: string,
  ) {
    return this.menuService.getMenu({
      categoryId,
      search,
      isVeg,
      isAvailable,
      minPrice,
      maxPrice,
      sortBy,
    });
  }

  @Query(() => FoodItemType)
  async getFoodItem(@Args('id') id: string) {
    return this.menuService.getFoodItem(id);
  }

  @Mutation(() => FoodItemType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN, Role.COLLEGE_ADMIN)
  async updateFoodAvailability(
    @Args('id') id: string,
    @Args('isAvailable') isAvailable: boolean,
    @Args('stockQuantity', { type: () => Int, nullable: true }) stockQuantity?: number,
    @Args('preparationTime', { type: () => Int, nullable: true }) preparationTime?: number,
  ) {
    return this.menuService.updateFoodAvailability(id, isAvailable, stockQuantity, preparationTime);
  }

  @Mutation(() => FoodItemType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  async createFoodItem(@Args('input') input: FoodItemInput) {
    return this.menuService.createFoodItem(input);
  }

  @Mutation(() => FoodItemType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  async updateFoodItem(
    @Args('id') id: string,
    @Args('input') input: FoodItemInput,
  ) {
    return this.menuService.updateFoodItem(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  async deleteFoodItem(@Args('id') id: string) {
    return this.menuService.deleteFoodItem(id);
  }
}
