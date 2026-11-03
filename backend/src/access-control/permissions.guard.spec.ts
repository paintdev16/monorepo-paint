import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import type { AccessControlService } from './access-control.service.js';
import { PermissionsGuard } from './permissions.guard.js';

describe('PermissionsGuard', () => {
  const context = (id?: string) => ({ getHandler: () => ({}), getClass: () => ({}), switchToHttp: () => ({ getRequest: () => ({ user: id ? { id } : undefined }) }) }) as unknown as ExecutionContext;
  it('rejects missing metadata or authentication and requires every permission', async () => {
    const reflector = new Reflector();
    const metadata = vi.spyOn(reflector, 'getAllAndOverride');
    const check = vi.fn().mockResolvedValue(false);
    const access = { hasPermissions: check } as unknown as AccessControlService;
    const guard = new PermissionsGuard(reflector, access);
    metadata.mockReturnValue(undefined);
    await expect(guard.canActivate(context('user'))).rejects.toBeInstanceOf(ForbiddenException);
    metadata.mockReturnValue(['a', 'b']);
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(context('user'))).rejects.toBeInstanceOf(ForbiddenException);
    expect(check).toHaveBeenCalledWith('user', ['a', 'b']);
  });
});
