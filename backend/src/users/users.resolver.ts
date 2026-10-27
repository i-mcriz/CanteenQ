import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserType } from '../common/types/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => [UserType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  async getUsers(@Args('role', { type: () => Role, nullable: true }) role?: Role) {
    return this.usersService.findAll(role);
  }

  @Query(() => UserType)
  @UseGuards(GqlAuthGuard)
  async getUser(@Args('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => UserType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  async toggleUserStatus(
    @Args('id') id: string,
    @Args('isActive') isActive: boolean,
  ) {
    return this.usersService.toggleUserStatus(id, isActive);
  }
}
