import { HttpException, HttpStatus } from '@nestjs/common';

export const FAILURE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_BACKOFF_MS = 15 * 60 * 1000;
const FIRST_LOCK_AT = 5;

export function nextFailure(previous: number, lastFailedAt: string | null, now: number) {
  const last = lastFailedAt ? Date.parse(lastFailedAt) : NaN;
  const recent = Number.isFinite(last) && now - last < FAILURE_WINDOW_MS;
  const failedAttempts = Math.min((recent ? previous : 0) + 1, 32);
  const delayMs = failedAttempts < FIRST_LOCK_AT ? 0 : Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(failedAttempts - FIRST_LOCK_AT, 10));
  return {
    failedAttempts,
    lastFailedAt: new Date(now).toISOString(),
    lockedUntil: delayMs ? new Date(now + delayMs).toISOString() : null,
  };
}

export class LoginBlockedException extends HttpException {
  constructor(readonly retryAfterSeconds: number) {
    super({ statusCode: 429, code: 'LOGIN_RATE_LIMITED', message: 'Too many login attempts. Try again later.', retryAfterSeconds }, HttpStatus.TOO_MANY_REQUESTS);
  }
}
