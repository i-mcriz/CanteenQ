import { Resolver, Query } from '@nestjs/graphql';
import { StaffService } from './staff.service';
import { StaffType } from '../common/types/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => StaffType)
export class StaffResolver {
  constructor(private staffService: StaffService) {}

  @Query(() => [StaffType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  async getStaffMembers() {
    return this.staffService.findAll();
  }
}
