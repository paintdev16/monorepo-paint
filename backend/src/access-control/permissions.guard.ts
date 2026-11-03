import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControlService } from './access-control.service.js';
import { PERMISSIONS_METADATA } from './permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly access: AccessControlService) {}

  async canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_METADATA, [context.getHandler(), context.getClass()]);
    if (!required?.length) throw new ForbiddenException('No permissions configured');
    const request = context.switchToHttp().getRequest<{ user?: { id?: string } }>();
    if (!request.user?.id) throw new UnauthorizedException();
    if (!(await this.access.hasPermissions(request.user.id, required))) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
