import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service.js';

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) throw new Error('JWT_SECRET must be at least 32 bytes');
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly auth: AuthService) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: jwtSecret(), algorithms: ['HS256'] });
  }

  validate(payload: { sub?: unknown; sid?: unknown }) {
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') return null;
    return this.auth.authenticate(payload.sub, payload.sid);
  }
}
