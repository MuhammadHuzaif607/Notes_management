import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailerModule } from './mailer/mailer.module';
import { NoteModule } from './note/note.module';

@Module({
  imports: [AuthModule, UserModule, PrismaModule, MailerModule, NoteModule],
})
export class AppModule {}
