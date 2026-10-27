import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { NotificationType } from '../common/types/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => NotificationType)
export class NotificationResolver {
  constructor(private notificationService: NotificationService) {}

  @Query(() => [NotificationType])
  @UseGuards(GqlAuthGuard)
  async getNotifications(@CurrentUser() user: any) {
    return this.notificationService.getUserNotifications(user.id);
  }

  @Mutation(() => NotificationType)
  @UseGuards(GqlAuthGuard)
  async markNotificationAsRead(@Args('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async markAllNotificationsAsRead(@CurrentUser() user: any) {
    return this.notificationService.markAllAsRead(user.id);
  }
}
