import { Resolver, Query } from '@nestjs/graphql';
import { PredictionService } from './prediction.service';
import { PredictionType } from '../common/types/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => PredictionType)
export class PredictionResolver {
  constructor(private predictionService: PredictionService) {}

  @Query(() => PredictionType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN, Role.STAFF)
  async getPredictions() {
    return this.predictionService.getPredictions();
  }
}
