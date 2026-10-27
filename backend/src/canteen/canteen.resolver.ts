import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CanteenService } from './canteen.service';
import { CanteenType } from '../common/types/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => CanteenType)
export class CanteenResolver {
  constructor(private canteenService: CanteenService) {}

  @Query(() => CanteenType)
  async getCanteen() {
    return this.canteenService.getCanteen();
  }

  @Mutation(() => CanteenType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  async updateCanteen(
    @Args('name', { nullable: true }) name?: string,
    @Args('location', { nullable: true }) location?: string,
    @Args('openingTime', { nullable: true }) openingTime?: string,
    @Args('closingTime', { nullable: true }) closingTime?: string,
    @Args('maxCapacity', { type: () => Int, nullable: true }) maxCapacity?: number,
    @Args('status', { nullable: true }) status?: string,
  ) {
    return this.canteenService.updateCanteen({
      name,
      location,
      openingTime,
      closingTime,
      maxCapacity,
      status,
    });
  }
}
