import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccessControlService } from './access-control.service.js';

@Controller('auth/me')
@UseGuards(AuthGuard('jwt'))
export class AccessControlController {
  constructor(private readonly access: AccessControlService) {}

  @Get('permissions')
  permissions(@Req() request: { user: { id: string } }) {
    return this.access.effectivePermissions(request.user.id);
  }
}
