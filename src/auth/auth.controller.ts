import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto,ResetPasswordDto } from './dto';
import { JwtGuard } from './guards/jwt.guard';
import { RefreshTokenGuard } from './guards/refresh.guard';
import { JwtPayload } from './types/user-from-jwt.interface'; //

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignUpDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  signin(@Body() dto: SignInDto) {
    return this.authService.signin(dto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refreshTokens(@Req() req: RequestWithUser) {
    const refreshToken = req.user.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is missing from request');
    }

    return this.authService.refreshTokens(Number(req.user.sub), refreshToken);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  logout(@Req() req: RequestWithUser) {
    return this.authService.logout(Number(req.user.sub));
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Body('email') email: string) {
    return this.authService.sendPasswordResetEmail(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
