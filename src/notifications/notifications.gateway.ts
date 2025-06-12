// src/notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import {
  NotificationType,
  NotificationPayload,
  BulkNotificationPayload,
} from './types/notification.types';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<number, string[]>(); // userId -> socketIds[]
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private redisService: RedisService,
    private jwtService: JwtService
  ) {
    this.setupRedisSubscriptions();
  }

  async handleConnection(client: Socket) {
    try {
      // Get token from auth or headers
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.id;

      // Store user connection
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, []);
      }
      this.connectedUsers.get(userId)!.push(client.id);

      // Join user to their personal room
      await client.join(`user_${userId}`);

      this.logger.log(`User ${userId} connected with socket ${client.id}`);

      // Emit connection success
      client.emit('connected', {
        message: 'Successfully connected to notifications',
        userId,
      });

      // Send any pending notifications (if you implement offline storage)
      await this.sendPendingNotifications(userId);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Connection authentication failed:', error.message);
      } else {
        this.logger.error('Connection authentication failed:', String(error));
      }
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    // Remove socket from connected users
    for (const [userId, socketIds] of this.connectedUsers.entries()) {
      const index = socketIds.indexOf(client.id);
      if (index > -1) {
        socketIds.splice(index, 1);
        if (socketIds.length === 0) {
          this.connectedUsers.delete(userId);
        }
        this.logger.log(`User ${userId} disconnected socket ${client.id}`);
        break;
      }
    }
  }

  @SubscribeMessage('acknowledge_notification')
  async handleNotificationAcknowledgment(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string }
  ) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.id;

      // Mark notification as read in Redis (you can also store in database)
      await this.redisService.publish('notification_acknowledged', {
        userId,
        notificationId: data.notificationId,
        timestamp: new Date(),
      });

      this.logger.log(
        `Notification ${data.notificationId} acknowledged by user ${userId}`
      );

      // Confirm acknowledgment
      client.emit('notification_acknowledged', {
        notificationId: data.notificationId,
        success: true,
      });
    } catch (error) {
      this.logger.error('Error acknowledging notification:', error);
      client.emit('error', { message: 'Failed to acknowledge notification' });
    }
  }

  @SubscribeMessage('get_online_status')
  async handleGetOnlineStatus(@ConnectedSocket() client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.id;

      client.emit('online_status', {
        userId,
        isOnline: this.connectedUsers.has(userId),
        connectedSockets: this.connectedUsers.get(userId)?.length || 0,
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to get online status' });
    }
  }

  private async setupRedisSubscriptions() {
    try {
      // Subscribe to single notification events
      await this.redisService.subscribe(
        'user_notifications',
        (message: NotificationPayload) => {
          this.sendNotificationToUser(message);
        }
      );

      // Subscribe to bulk notification events
      await this.redisService.subscribe(
        'bulk_notifications',
        (message: BulkNotificationPayload) => {
          message.notifications.forEach((notification) => {
            this.sendNotificationToUser(notification);
          });
        }
      );

      this.logger.log('Redis subscriptions set up successfully');
    } catch (error) {
      this.logger.error('Failed to set up Redis subscriptions:', error);
    }
  }

  private async sendNotificationToUser(notification: NotificationPayload) {
    const userSockets = this.connectedUsers.get(notification.userId);

    if (userSockets && userSockets.length > 0) {
      // Send to all user's connected sockets
      this.server
        .to(`user_${notification.userId}`)
        .emit('notification', notification);
      this.logger.log(
        `Notification sent to user ${notification.userId}: ${notification.type}`
      );
    } else {
      // Store notification for when user comes online
      await this.storeOfflineNotification(notification);
      this.logger.log(
        `User ${notification.userId} offline, notification stored`
      );
    }
  }

  private async storeOfflineNotification(notification: NotificationPayload) {
    try {
      // Store in Redis with expiration (optional - you might want to store in database instead)
      const key = `offline_notifications:${notification.userId}`;
      await this.redisService.publish('store_offline_notification', {
        key,
        notification,
        expiry: 86400, // 24 hours
      });
    } catch (error) {
      this.logger.error('Failed to store offline notification:', error);
    }
  }

  private async sendPendingNotifications(userId: number) {
    try {
      // Request pending notifications from Redis or database
      await this.redisService.publish('get_pending_notifications', { userId });
    } catch (error) {
      this.logger.error('Failed to send pending notifications:', error);
    }
  }

  // Public methods to be called by services
  async sendNotification(notification: NotificationPayload) {
    await this.redisService.publish('user_notifications', notification);
  }

  async sendBulkNotifications(notifications: NotificationPayload[]) {
    await this.redisService.publish('bulk_notifications', { notifications });
  }

  // Method to check if user is online
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  // Method to get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}
