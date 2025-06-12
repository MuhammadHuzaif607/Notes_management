// src/auth/strategies/jwt-refresh.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh'
) {
  constructor(config: ConfigService) {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.body?.refreshToken,
      ]),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
      passReqToCallback: true,
    };

    super(options);
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.body.refreshToken;
    return {
      ...payload,
      refreshToken,
    };
  }
}
