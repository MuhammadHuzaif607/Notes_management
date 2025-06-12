// src/note/note.module.ts
import { Module } from '@nestjs/common';
import { NoteService } from './note.service';
import { NoteController } from './note.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module'; 

@Module({
  imports: [NotificationsModule],
  controllers: [NoteController],
  providers: [NoteService, PrismaService],
})
export class NoteModule {}
