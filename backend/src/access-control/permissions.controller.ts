import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdministrationService } from './administration.service.js';
import { PermissionPageDto, PermissionCreateDto, PermissionUpdateDto } from './access.dto.js';
import { Permissions } from './permissions.decorator.js';
import { PermissionsGuard } from './permissions.guard.js';
import { SuperAdminGuard } from './super-admin.guard.js';

@Controller('permissions')
@UseGuards(AuthGuard('jwt'))
export class PermissionsController {
  constructor(private readonly admin: AdministrationService) {}
  @Get() @Permissions('permissions.view') @UseGuards(PermissionsGuard)
  list(@Query() query: PermissionPageDto) { return this.admin.listPermissions(query); }
  @Get(':id') @Permissions('permissions.view') @UseGuards(PermissionsGuard)
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return this.admin.permission(id); }
  @Post() @UseGuards(SuperAdminGuard)
  create(@Body() input: PermissionCreateDto) { return this.admin.createPermission(input); }
  @Patch(':id') @UseGuards(SuperAdminGuard)
  update(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() input: PermissionUpdateDto) { return this.admin.updatePermission(id, input); }
  @Delete(':id') @HttpCode(204) @UseGuards(SuperAdminGuard)
  delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return this.admin.deletePermission(id); }
}
