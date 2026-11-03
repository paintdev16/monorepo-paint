import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdministrationService } from './administration.service.js';
import { IdsDto } from './access.dto.js';
import { AccessControlService } from './access-control.service.js';
import { Permissions } from './permissions.decorator.js';
import { PermissionsGuard } from './permissions.guard.js';
import { SuperAdminGuard } from './super-admin.guard.js';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersRolesController {
  constructor(private readonly admin: AdministrationService, private readonly access: AccessControlService) {}
  @Get(':id/roles') @Permissions('users.view') @UseGuards(PermissionsGuard)
  roles(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return this.admin.userRoles(id); }
  @Get(':id/permissions') @Permissions('users.view') @UseGuards(PermissionsGuard)
  async permissions(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    await this.admin.userRoles(id);
    return this.access.effectivePermissions(id);
  }
  @Put(':id/roles') @UseGuards(SuperAdminGuard)
  sync(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() input: IdsDto) { return this.admin.syncRoles(id, input.ids); }
}
