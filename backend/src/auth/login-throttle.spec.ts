import { FAILURE_WINDOW_MS, LoginBlockedException, nextFailure } from './login-throttle.js';

describe('account login backoff', () => {
  it('starts after five failures, doubles and caps at 15 minutes', () => {
    const now = Date.parse('2026-01-01T12:00:00.000Z');
    const last = new Date(now - 1000).toISOString();
    expect(nextFailure(3, last, now)).toMatchObject({ failedAttempts: 4, lockedUntil: null });
    expect(Date.parse(nextFailure(4, last, now).lockedUntil!) - now).toBe(1000);
    expect(Date.parse(nextFailure(5, last, now).lockedUntil!) - now).toBe(2000);
    expect(Date.parse(nextFailure(20, last, now).lockedUntil!) - now).toBe(15 * 60 * 1000);
  });

  it('resets the count after a day without failures', () => {
    const now = Date.parse('2026-01-02T12:00:00.000Z');
    const previous = new Date(now - FAILURE_WINDOW_MS).toISOString();
    expect(nextFailure(12, previous, now)).toMatchObject({ failedAttempts: 1, lockedUntil: null });
  });

  it('returns a generic temporary block and retry time', () => {
    const error = new LoginBlockedException(3);
    expect(error.getStatus()).toBe(429);
    expect(error.getResponse()).toEqual({ statusCode: 429, code: 'LOGIN_RATE_LIMITED', message: 'Too many login attempts. Try again later.', retryAfterSeconds: 3 });
  });
});
