import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdministrationService } from './administration.service.js';
import { IdsDto, PageDto, RoleCreateDto, RoleUpdateDto } from './access.dto.js';
import { Permissions } from './permissions.decorator.js';
import { PermissionsGuard } from './permissions.guard.js';
import { SuperAdminGuard } from './super-admin.guard.js';

@Controller('roles')
@UseGuards(AuthGuard('jwt'))
export class RolesController {
  constructor(private readonly admin: AdministrationService) {}
  @Get() @Permissions('roles.view') @UseGuards(PermissionsGuard)
  list(@Query() query: PageDto) { return this.admin.listRoles(query); }
  @Get(':id') @Permissions('roles.view') @UseGuards(PermissionsGuard)
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return this.admin.role(id); }
  @Post() @UseGuards(SuperAdminGuard)
  create(@Body() input: RoleCreateDto) { return this.admin.createRole(input); }
  @Patch(':id') @UseGuards(SuperAdminGuard)
  update(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() input: RoleUpdateDto) { return this.admin.updateRole(id, input); }
  @Delete(':id') @HttpCode(204) @UseGuards(SuperAdminGuard)
  delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return this.admin.deleteRole(id); }
  @Put(':id/permissions') @UseGuards(SuperAdminGuard)
  sync(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() input: IdsDto) { return this.admin.syncPermissions(id, input.ids); }
}
