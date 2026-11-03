import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccessControlService } from './access-control.service.js';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly access: AccessControlService) {}
  async canActivate(context: ExecutionContext) {
    const { user } = context.switchToHttp().getRequest<{ user?: { id?: string } }>();
    if (!user?.id) throw new UnauthorizedException();
    if (!(await this.access.isSuperAdmin(user.id))) throw new ForbiddenException('Super administrator required');
    return true;
  }
}
