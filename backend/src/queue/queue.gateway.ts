import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // client connected
  }

  handleDisconnect(client: Socket) {
    // client disconnected
  }

  @SubscribeMessage('joinOrder')
  handleJoinOrder(client: Socket, orderId: string) {
    client.join(`order:${orderId}`);
  }

  @SubscribeMessage('joinUser')
  handleJoinUser(client: Socket, userId: string) {
    client.join(`user:${userId}`);
  }

  broadcastQueueUpdate(payload: any) {
    this.server?.emit('QUEUE_UPDATED', payload);
  }

  broadcastCrowdDensity(payload: any) {
    this.server?.emit('CROWD_DENSITY_CHANGED', payload);
  }

  broadcastFoodAvailability(payload: any) {
    this.server?.emit('FOOD_AVAILABILITY_CHANGED', payload);
  }

  broadcastOrderStatus(orderId: string, payload: any) {
    this.server?.emit('ORDER_STATUS_CHANGED', payload);
    this.server?.to(`order:${orderId}`).emit('ORDER_STATUS_CHANGED', payload);
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server?.to(`user:${userId}`).emit('NOTIFICATION_CREATED', notification);
    this.server?.emit('NOTIFICATION_CREATED', notification);
  }
}
