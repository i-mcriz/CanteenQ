import { Resolver, Query } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';
import { AnalyticsType } from '../common/types/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => AnalyticsType)
export class AnalyticsResolver {
  constructor(private analyticsService: AnalyticsService) {}

  @Query(() => AnalyticsType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  async getAnalytics() {
    return this.analyticsService.getAnalytics();
  }
}
