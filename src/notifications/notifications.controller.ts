// src/notifications/notifications.controller.ts
import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { NotificationType } from './types/notification.types';

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // Test endpoint to send a notification
  @Post('test')
  async testNotification(@Req() req: any, @Body() body: { message?: string }) {
    const userId = req.user.id;
    const message = body.message || 'This is a test notification';

    await this.notificationsService.sendCustomNotification(
      userId,
      'test-note-id',
      'Test Notification',
      message,
      NotificationType.NOTE_CREATED,
      { isTest: true }
    );

    return {
      success: true,
      message: 'Test notification sent',
      userId,
    };
  }

  // Test bulk notification
  @Post('test-bulk')
  async testBulkNotification(@Req() req: any) {
    const userId = req.user.id;

    await this.notificationsService.sendBulkArchiveNotification(
      userId,
      ['note-1', 'note-2', 'note-3'],
      3
    );

    return {
      success: true,
      message: 'Test bulk notification sent',
      userId,
    };
  }

  // Get system stats
  @Get('stats')
  async getStats() {
    return this.notificationsService.getSystemStats();
  }

  // Check if current user is online
  @Get('online-status')
  async getOnlineStatus(@Req() req: any) {
    const userId = req.user.id;
    return {
      userId,
      isOnline: this.notificationsService.isUserOnline(userId),
      timestamp: new Date(),
    };
  }
}
