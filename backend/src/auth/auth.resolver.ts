import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthPayloadType, UserType } from '../common/types/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayloadType)
  async login(
    @Args('email') email: string,
    @Args('password') pass: string,
  ) {
    return this.authService.login(email, pass);
  }

  @Mutation(() => AuthPayloadType)
  async register(
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('password') pass: string,
    @Args('phone', { nullable: true }) phone?: string,
    @Args('role', { type: () => Role, nullable: true }) role?: Role,
    @Args('department', { nullable: true }) department?: string,
    @Args('semester', { nullable: true }) semester?: number,
    @Args('className', { nullable: true }) className?: string,
  ) {
    return this.authService.register({
      name,
      email,
      password: pass,
      phone,
      role,
      department,
      semester,
      className,
    });
  }

  @Query(() => UserType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.id);
  }
}
