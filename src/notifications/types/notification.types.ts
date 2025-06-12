// src/notifications/types/notification.types.ts
export enum NotificationType {
  NOTE_CREATED = 'note_created',
  NOTE_UPDATED = 'note_updated',
  NOTE_DELETED = 'note_deleted',
  NOTE_ARCHIVED = 'note_archived',
  NOTE_RESTORED = 'note_restored',
  VERSION_CREATED = 'version_created',
  NOTE_REVERTED = 'note_reverted',
  BULK_ARCHIVE = 'bulk_archive',
  BULK_RESTORE = 'bulk_restore',
}

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  userId: number;
  noteId: string;
  title: string;
  message: string;
  metadata?: {
    noteTitle?: string;
    versionId?: string;
    oldVersion?: string;
    newVersion?: string;
    noteIds?: string[];
    count?: number;
    [key: string]: any;
  };
  timestamp: Date;
  read: boolean;
}

export interface SocketUser {
  userId: number;
  socketId: string;
}

export interface BulkNotificationPayload {
  notifications: NotificationPayload[];
}
