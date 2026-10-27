import { Resolver, Query } from '@nestjs/graphql';
import { StudentsService } from './students.service';
import { StudentType } from '../common/types/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => StudentType)
export class StudentsResolver {
  constructor(private studentsService: StudentsService) {}

  @Query(() => [StudentType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN, Role.STAFF)
  async getStudents() {
    return this.studentsService.findAll();
  }
}
