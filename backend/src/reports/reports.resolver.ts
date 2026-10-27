import { Resolver, Query } from '@nestjs/graphql';
import { ReportsService } from './reports.service';
import { ReportSummaryType } from '../common/types/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => ReportSummaryType)
export class ReportsResolver {
  constructor(private reportsService: ReportsService) {}

  @Query(() => ReportSummaryType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  async getReportSummary() {
    return this.reportsService.getReportSummary();
  }
}
