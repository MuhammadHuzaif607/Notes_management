import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Param,
  UseGuards,
  Patch,
  Delete,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { NoteService } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RefreshTokenGuard } from '../auth/guards/refresh.guard';
import { JwtPayload } from '../auth/types/user-from-jwt.interface';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  // Get all notes with optional archived parameter
  @Get('/')
  @UseGuards(JwtGuard)
  async getAllNotes(
    @Req() req: Request,
    @Query('includeArchived') includeArchived?: string
  ) {
    const userId = (req.user as any).id;
    const includeArchivedBool = includeArchived === 'true';
    return this.noteService.getAllNotes(userId, includeArchivedBool);
  }

  // Get only archived notes
  @Get('/archived')
  @UseGuards(JwtGuard)
  async getArchivedNotes(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.noteService.getArchivedNotes(userId);
  }

  // Create a new note
  @Post('/')
  @UseGuards(JwtGuard)
  async createNote(@Req() req: Request, @Body() dto: CreateNoteDto) {
    const userId = (req.user as any).id;
    return this.noteService.createNote(userId, dto);
  }

  // Bulk archive notes
  @Patch('/bulk/archive')
  @UseGuards(JwtGuard)
  async bulkArchiveNotes(
    @Req() req: Request,
    @Body() dto: { noteIds: string[] }
  ) {
    const userId = (req.user as any).id;
    return this.noteService.bulkArchiveNotes(userId, dto.noteIds);
  }

  // Bulk restore notes
  @Patch('/bulk/restore')
  @UseGuards(JwtGuard)
  async bulkRestoreNotes(
    @Req() req: Request,
    @Body() dto: { noteIds: string[] }
  ) {
    const userId = (req.user as any).id;
    return this.noteService.bulkRestoreNotes(userId, dto.noteIds);
  }

  // Get note by ID with optional archived parameter
  @Get(':id')
  @UseGuards(JwtGuard)
  async getNote(
    @Req() req: Request,
    @Param('id') noteId: string,
    @Query('includeArchived') includeArchived?: string
  ) {
    const userId = (req.user as any).id;
    const includeArchivedBool = includeArchived === 'true';
    return this.noteService.getNoteById(userId, noteId, includeArchivedBool);
  }

  // Update note
  @Patch(':id')
  @UseGuards(JwtGuard)
  async updateNote(
    @Req() req: Request,
    @Param('id') noteId: string,
    @Body() dto: UpdateNoteDto
  ) {
    const userId = (req.user as any).id;
    return this.noteService.updateNote(userId, noteId, dto);
  }

  // Restore archived note
  @Patch(':id/restore')
  @UseGuards(JwtGuard)
  async restoreNote(@Req() req: Request, @Param('id') noteId: string) {
    const userId = (req.user as any).id;
    return this.noteService.restoreNote(userId, noteId);
  }

  // Soft delete (archive) note
  @Delete(':id')
  @UseGuards(JwtGuard)
  async deleteNote(@Req() req: Request, @Param('id') noteId: string) {
    const userId = (req.user as any).id;
    return this.noteService.deleteNote(userId, noteId);
  }

  // Permanently delete archived note
  @Delete(':id/permanent')
  @UseGuards(JwtGuard)
  async permanentlyDeleteNote(
    @Req() req: Request,
    @Param('id') noteId: string
  ) {
    const userId = (req.user as any).id;
    return this.noteService.permanentlyDeleteNote(userId, noteId);
  }

  // Get all versions of a specific note
  @Get(':id/versions')
  @UseGuards(JwtGuard)
  async getNoteVersions(@Req() req: Request, @Param('id') noteId: string) {
    const userId = (req.user as any).id;
    return this.noteService.getNoteVersions(userId, noteId);
  }

  // Get specific version details
  @Get(':id/versions/:versionId')
  @UseGuards(JwtGuard)
  async getNoteVersionById(
    @Req() req: Request,
    @Param('id') noteId: string,
    @Param('versionId') versionId: string
  ) {
    const userId = (req.user as any).id;
    return this.noteService.getNoteVersionById(userId, noteId, versionId);
  }

  // Revert note to a previous version
  @Post(':id/versions/:versionId/revert')
  @UseGuards(JwtGuard)
  async revertNoteToVersion(
    @Req() req: Request,
    @Param('id') noteId: string,
    @Param('versionId') versionId: string
  ) {
    const userId = (req.user as any).id;
    return this.noteService.revertNoteToVersion(userId, noteId, versionId);
  }

  // Get audit logs for a specific note
  @Get(':id/audit-logs')
  @UseGuards(JwtGuard)
  async getNoteAuditLogs(@Req() req: Request, @Param('id') noteId: string) {
    const userId = (req.user as any).id;
    return this.noteService.getNoteAuditLogs(userId, noteId);
  }
}
