// src/auth/types/user-from-jwt.interface.ts
export interface JwtPayload {
  sub: string;
  email: string;
  refreshToken?: string;
}
