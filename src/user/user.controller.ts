import {
  Controller,
  Get,
  Req,
  UseGuards,
  Put,
  Body,
  Post,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport'; // or your custom AuthGuard
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { s3Uploader } from 'src/common/utils/s3Uploader';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@UseGuards(AuthGuard('jwt')) // 'jwt' is the default strategy name; adjust if custom
@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private readonly configService: ConfigService
  ) {}

  @Get('me')
  getMyProfile(@Req() req: Request) {
    const userId = (req.user as any).id;
    if (!userId) {
      throw new Error('User ID not found in request');
    } // ideally define a custom type for req.user
    return this.userService.findById(userId);
  }

  @Put('profile')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    if (!req.user?.id) {
      throw new Error('User ID not found in request');
    }

    return this.userService.updateProfile(req.user.id, dto);
  }

  @Post('profile/picture')
  @UseInterceptors(
    FileInterceptor('file', {
      ...s3Uploader(new ConfigService()), // or use `this.configService` inside a factory class
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    })
  )
  async uploadProfilePicture(
    @GetUser('id') userId: number,
    @UploadedFile() file: Express.MulterS3.File
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.userService.updateProfilePicture(userId, file.location); // file.location is S3 URL
  }
}
