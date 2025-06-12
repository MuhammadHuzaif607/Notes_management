import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { Visibility } from '@prisma/client';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '@prisma/client';


@Injectable()
export class NoteService {
  constructor(
    private readonly prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  // Modified getAllNotes method - exclude archived notes by default
  async getAllNotes(userId: number, includeArchived: boolean = false) {
    const whereClause: any = {
      ownerId: userId,
    };

    // Only include archived notes if explicitly requested
    if (!includeArchived) {
      whereClause.archived = false;
    }

    return this.prisma.note.findMany({
      where: whereClause,
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async createNote(userId: number, dto: CreateNoteDto) {
    const {
      title,
      description,
      visibility,
      tagIds = [],
      customUserIds = [],
    } = dto;

    const note = await this.prisma.note.create({
      data: {
        title,
        description,
        visibility,
        ownerId: userId,
        tags: {
          create: tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        users:
          visibility === Visibility.CUSTOM
            ? {
                create: customUserIds.map((id) => ({
                  user: { connect: { id } },
                })),
              }
            : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        users: { include: { user: true } },
      },
    });

    // Send notification after successful creation
    await this.notificationsService.sendNoteCreatedNotification(
      userId,
      note.id,
      note.title
    );

    return note;
  }

  // Modified getNoteById method - exclude archived notes by default
  async getNoteById(
    userId: number,
    noteId: string,
    includeArchived: boolean = false
  ) {
    const whereClause: any = {
      id: noteId,
    };

    if (!includeArchived) {
      whereClause.archived = false;
    }

    const note = await this.prisma.note.findUnique({
      where: whereClause,
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!note || note.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return note;
  }

  // NEW METHOD: Get only archived notes
  async getArchivedNotes(userId: number) {
    return this.prisma.note.findMany({
      where: {
        ownerId: userId,
        archived: true,
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async updateNote(userId: number, noteId: string, dto: UpdateNoteDto) {
    // 1. Verify note exists and user has permission
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // 2. Extract changes for notifications
    const changes = {
      title: dto.title !== undefined && dto.title !== note.title,
      description:
        dto.description !== undefined && dto.description !== note.description,
      visibility:
        dto.visibility !== undefined && dto.visibility !== note.visibility,
      tags:
        dto.tags !== undefined
          ? this.getTagChanges(
              note.tags.map((t) => t.tag.id),
              dto.tags
            )
          : { added: [], removed: [] },
    };

    // 3. Use transaction for atomic operations
    return this.prisma.$transaction(async (prisma) => {
      // Create version history before updating
      const version = await prisma.noteVersion.create({
        data: {
          noteId: note.id,
          title: note.title,
          description: note.description,
          createdBy: userId,
          tagsSnapshot: JSON.stringify(note.tags.map((t) => t.tag)),
          visibility: note.visibility,
        },
      });

      // Prepare update data
      const updateData: Prisma.NoteUpdateInput = {
        updatedAt: new Date(),
      };

      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.description !== undefined)
        updateData.description = dto.description;
      if (dto.visibility !== undefined) updateData.visibility = dto.visibility;

      // Handle tags update if provided
      if (dto.tags !== undefined) {
        updateData.tags = {
          deleteMany: {}, // Remove all existing tags
          create: dto.tags.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        };
      }

      // Perform the update
      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: updateData,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // 4. Send notifications after successful update
      await Promise.all([
        this.notificationsService.sendNoteUpdatedNotification(
          userId,
          updatedNote.id,
          updatedNote.title,
        ),
        this.notificationsService.sendVersionCreatedNotification(
          userId,
          updatedNote.id,
          updatedNote.title,
          version.id
        ),
      ]);

      return updatedNote;
    });
  }

  // Helper method to detect tag changes
  private getTagChanges(currentTags: string[], newTags: string[]) {
    return {
      added: newTags.filter((tag) => !currentTags.includes(tag)),
      removed: currentTags.filter((tag) => !newTags.includes(tag)),
    };
  }

  // Modified deleteNote method - soft delete (archive)
  async deleteNote(userId: number, noteId: string) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Send notification
    await this.notificationsService.sendNoteDeletedNotification(
      userId,
      note.id,
      note.title
    );

    // Soft delete - mark as archived
    return this.prisma.note.update({
      where: { id: noteId },
      data: {
        archived: true,
        updatedAt: new Date(),
      },
    });
  }

  // NEW METHOD: Restore archived note
  async restoreNote(userId: number, noteId: string) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (!note.archived) {
      throw new BadRequestException('Note is not archived');
    }

    return this.prisma.note.update({
      where: { id: noteId },
      data: {
        archived: false,
        updatedAt: new Date(),
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });
  }

  // NEW METHOD: Permanently delete archived note
  async permanentlyDeleteNote(userId: number, noteId: string) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (!note.archived) {
      throw new BadRequestException(
        'Note must be archived before permanent deletion'
      );
    }

    // Use transaction to ensure all related records are properly deleted
    return this.prisma.$transaction(async (prisma) => {
      // Delete all related records
      await prisma.noteTag.deleteMany({
        where: { noteId: noteId },
      });

      await prisma.noteUser.deleteMany({
        where: { noteId: noteId },
      });

      await prisma.noteVersion.deleteMany({
        where: { noteId: noteId },
      });

      // Finally delete the note itself
      return prisma.note.delete({
        where: { id: noteId },
      });
    });
  }

  // NEW METHOD: Bulk archive multiple notes
  async bulkArchiveNotes(userId: number, noteIds: string[]) {
    // Verify all notes belong to the user and are not already archived
    const notes = await this.prisma.note.findMany({
      where: {
        id: { in: noteIds },
        ownerId: userId,
        archived: false,
      },
    });

    if (notes.length !== noteIds.length) {
      throw new ForbiddenException(
        'Some notes not found, access denied, or already archived'
      );
    }

    return this.prisma.note.updateMany({
      where: {
        id: { in: noteIds },
        ownerId: userId,
      },
      data: {
        archived: true,
        updatedAt: new Date(),
      },
    });
  }

  // NEW METHOD: Bulk restore multiple notes
  async bulkRestoreNotes(userId: number, noteIds: string[]) {
    // Verify all notes belong to the user and are archived
    const notes = await this.prisma.note.findMany({
      where: {
        id: { in: noteIds },
        ownerId: userId,
        archived: true,
      },
    });

    if (notes.length !== noteIds.length) {
      throw new ForbiddenException(
        'Some notes not found, access denied, or not archived'
      );
    }

    return this.prisma.note.updateMany({
      where: {
        id: { in: noteIds },
        ownerId: userId,
      },
      data: {
        archived: false,
        updatedAt: new Date(),
      },
    });
  }

  // BONUS METHOD: Get notes statistics
  async getNotesStats(userId: number) {
    const [totalNotes, archivedNotes, activeNotes] = await Promise.all([
      this.prisma.note.count({
        where: { ownerId: userId },
      }),
      this.prisma.note.count({
        where: { ownerId: userId, archived: true },
      }),
      this.prisma.note.count({
        where: { ownerId: userId, archived: false },
      }),
    ]);

    return {
      total: totalNotes,
      active: activeNotes,
      archived: archivedNotes,
    };
  }

  // GET ALL VERSIONS OF A NOTE
  async getNoteVersions(userId: number, noteId: string) {
    // First check if user has access to the note
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.noteVersion.findMany({
      where: { noteId: noteId },
      include: {
        note: {
          select: {
            title: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // GET SPECIFIC VERSION DETAILS
  async getNoteVersionById(userId: number, noteId: string, versionId: string) {
    // Check access to note
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const version = await this.prisma.noteVersion.findUnique({
      where: {
        id: versionId,
        noteId: noteId, // Ensure version belongs to the note
      },
      include: {
        note: {
          select: {
            title: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return {
      ...version,
      // Parse tags snapshot back to object
      tags: version.tagsSnapshot ? JSON.parse(version.tagsSnapshot) : [],
    };
  }

  // REVERT NOTE TO PREVIOUS VERSION
  async revertNoteToVersion(userId: number, noteId: string, versionId: string) {
    // Check access to note
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!note || note.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Get the version to revert to
    const version = await this.prisma.noteVersion.findUnique({
      where: {
        id: versionId,
        noteId: noteId,
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Create a version of current state before reverting
      await prisma.noteVersion.create({
        data: {
          noteId: noteId,
          title: note.title,
          description: note.description,
          createdBy: userId,
          tagsSnapshot: JSON.stringify(note.tags.map((nt) => nt.tag)),
          visibility: note.visibility,
          isRevertPoint: true, // Mark this as a revert point
        },
      });

      // Parse tags from version snapshot
      const versionTags = version.tagsSnapshot
        ? JSON.parse(version.tagsSnapshot)
        : [];

      // Clear existing tags
      await prisma.noteTag.deleteMany({
        where: { noteId: noteId },
      });

      // Recreate tags from version (if any exist)
      if (versionTags.length > 0) {
        const tagConnections = [];
        for (const tag of versionTags) {
          // Find or create the tag
          const existingTag = await prisma.tag.findUnique({
            where: { id: tag.id },
          });

          if (existingTag) {
            tagConnections.push({
              noteId: noteId,
              tagId: tag.id,
            });
          }
        }

        if (tagConnections.length > 0) {
          await prisma.noteTag.createMany({
            data: tagConnections,
          });
        }
      }

      // Update note with version data
      return prisma.note.update({
        where: { id: noteId },
        data: {
          title: version.title,
          description: version.description,
          visibility: version.visibility,
          updatedAt: new Date(),
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });
  }

  // GET AUDIT LOGS FOR A NOTE
  async getNoteAuditLogs(userId: number, noteId: string) {
    // Check access to note
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const versions = await this.prisma.noteVersion.findMany({
      where: { noteId: noteId },
      include: {
        note: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform versions into audit log format
    return versions.map((version, index) => {
      const previousVersion = versions[index + 1];

      return {
        id: version.id,
        action: version.isRevertPoint ? 'REVERTED' : 'UPDATED',
        timestamp: version.createdAt,
        userId: version.createdBy,
        noteId: version.noteId,
        noteTitle: version.note.title,
        changes: {
          title: {
            from: previousVersion?.title || null,
            to: version.title,
          },
          description: {
            from: previousVersion?.description || null,
            to: version.description,
          },
          visibility: {
            from: previousVersion?.visibility || null,
            to: version.visibility,
          },
        },
        versionId: version.id,
        isRevertPoint: version.isRevertPoint || false,
      };
    });
  }
}
