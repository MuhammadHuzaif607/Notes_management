import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
// src/user/user.service.ts

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    if (dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email is already in use');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePicture: true,
        updatedAt: true,
      },
    });
  }

  async updateProfilePicture(userId: number, imageUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profilePicture: imageUrl },
    });
  }
}
