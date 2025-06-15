import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailerModule } from './mailer/mailer.module';
import { NoteModule } from './note/note.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AppController } from './app.controller';

@Module({
  imports: [AuthModule, UserModule, PrismaModule, MailerModule, NoteModule],
  controllers: [AppController],
})
export class AppModule {}
