import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt') {
  constructor(private jwt: JwtService, private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const refreshToken = authHeader.split(' ')[1];

    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Attach both payload and token to req.user
      req['user'] = {
        ...payload,
        refreshToken, // pass the raw token
      };

      return true;
    } catch (err) {
      console.log('Error', err);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
