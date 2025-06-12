// src/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import {
  NotificationPayload,
  NotificationType,
} from './types/notification.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private notificationsGateway: NotificationsGateway) {}

  async sendNoteCreatedNotification(
    userId: number,
    noteId: string,
    noteTitle: string
  ) {
    const notification: NotificationPayload = {
      id: uuidv4(),
      type: NotificationType.NOTE_CREATED,
      userId,
      noteId,
      title: 'Note Created',
      message: `Your note "${noteTitle}" has been created successfully.`,
      metadata: { noteTitle },
      timestamp: new Date(),
      read: false,
    };

    try {
      await this.notificationsGateway.sendNotification(notification);
      this.logger.log(`Note created notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to send note created notification:', error);
    }
  }

  async sendNoteUpdatedNotification(
    userId: number,
    noteId: string,
    noteTitle: string,
    changes?: string[]
  ) {
    const changesText =
      changes && changes.length > 0 ? ` (${changes.join(', ')} updated)` : '';

    const notification: NotificationPayload = {
      id: uuidv4(),
      type: NotificationType.NOTE_UPDATED,
      userId,
      noteId,
      title: 'Note Updated',
      message: `Your note "${noteTitle}" has been updated${changesText}.`,
      metadata: { noteTitle, changes },
      timestamp: new Date(),
      read: false,
    };

    try {
      await this.notificationsGateway.sendNotification(notification);
      this.logger.log(`Note updated notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to send note updated notification:', error);
    }
  }

  async sendNoteDeletedNotification(
    userId: number,
    noteId: string,
    noteTitle: string
  ) {
    const notification: NotificationPayload = {
      id: uuidv4(),
      type: NotificationType.NOTE_DELETED,
      userId,
      noteId,
      title: 'Note Archived',
      message: `Your note "${noteTitle}" has been moved to archive.`,
      metadata: { noteTitle },
      timestamp: new Date(),
      read: false,
    };

    try {
      await this.notificationsGateway.sendNotification(notification);
      this.logger.log(`Note deleted notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to send note deleted notification:', error);
    }
  }

  async sendNoteRestoredNotification(
    userId: number,
    noteId: string,
    noteTitle: string
  ) {
    const notification: NotificationPayload = {
      id: uuidv4(),
      type: NotificationType.NOTE_RESTORED,
      userId,
      noteId,
      title: 'Note Restored',
      message: `Your note "${noteTitle}" has been restored from archive.`,
      metadata: { noteTitle },
      timestamp: new Date(),
      read: false,
    };

    try {
      await this.notificationsGateway.sendNotification(notification);
      this.logger.log(`Note restored notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to send note restored notification:', error);
    }
  }

  async sendVersionCreatedNotification(
    userId: number,
    noteId: string,
    noteTitle: string,
    versionId: string
  ) {
    const notification: NotificationPayload = {
      id: uuidv4(),
      type: NotificationType.VERSION_CREATED,
      userId,
      noteId,
      title: 'New Version Created',
      message: `A new version of "${noteTitle}" has been created automatically.`,
      metadata: { noteTitle, versionId },
      timestamp: new Date(),
      read: false,
    };

    try {
      await this.notificationsGateway.sendNotification(notification);
      this.logger.log(`Version created notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to send version created notification:', error);
    }
  }

  async sendNoteRevertedNotification(
    userId: number,
    noteId: string,
    noteTitle: string,
    versionId: string
  ) {
    const notification: NotificationPayload = {
      id: uuidv4(),
      type: NotificationType.NOTE_REVERTED,
      userId,
      noteId,
      title: 'Note Reverted',
      message: `Your note "${noteTitle}" has been reverted to a previous version.`,
      metadata: { noteTitle, versionId },
      timestamp: new Date(),
      read: false,
    };

    try {
      await this.notificationsGateway.sendNotification(notification);
      this.logger.log(`Note reverted notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to send note reverted notification:', error);
    }
  }

  async sendBulkArchiveNotification(
    userId: number,
    noteIds: string[],
    count: number
  ) {
    const notification: NotificationPayload = {
      id: uuidv4(),
      type: NotificationType.BULK_ARCHIVE,
      userId,
      noteId: noteIds[0], // Use first note ID as reference
      title: 'Notes Archived',
      message: `${count} note${count > 1 ? 's' : ''} ${
        count > 1 ? 'have' : 'has'
      } been archived.`,
      metadata: { noteIds, count },
      timestamp: new Date(),
      read: false,
    };

    try {
      await this.notificationsGateway.sendNotification(notification);
      this.logger.log(`Bulk archive notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to send bulk archive notification:', error);
    }
  }

  async sendBulkRestoreNotification(
    userId: number,
    noteIds: string[],
    count: number
  ) {
    const notification: NotificationPayload = {
      id: uuidv4(),
      type: NotificationType.BULK_RESTORE,
      userId,
      noteId: noteIds[0], // Use first note ID as reference
      title: 'Notes Restored',
      message: `${count} note${count > 1 ? 's' : ''} ${
        count > 1 ? 'have' : 'has'
      } been restored from archive.`,
      metadata: { noteIds, count },
      timestamp: new Date(),
      read: false,
    };

    try {
      await this.notificationsGateway.sendNotification(notification);
      this.logger.log(`Bulk restore notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to send bulk restore notification:', error);
    }
  }

  // Method to send custom notifications
  async sendCustomNotification(
    userId: number,
    noteId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: any
  ) {
    const notification: NotificationPayload = {
      id: uuidv4(),
      type,
      userId,
      noteId,
      title,
      message,
      metadata,
      timestamp: new Date(),
      read: false,
    };

    try {
      await this.notificationsGateway.sendNotification(notification);
      this.logger.log(`Custom notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to send custom notification:', error);
    }
  }

  // Check if user is online
  isUserOnline(userId: number): boolean {
    return this.notificationsGateway.isUserOnline(userId);
  }

  // Get system stats
  getSystemStats() {
    return {
      connectedUsers: this.notificationsGateway.getConnectedUsersCount(),
      timestamp: new Date(),
    };
  }
}
