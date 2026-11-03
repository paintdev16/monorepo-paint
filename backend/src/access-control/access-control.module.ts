import { Module } from '@nestjs/common';
import { AccessControlController } from './access-control.controller.js';
import { AccessControlService } from './access-control.service.js';
import { PermissionsGuard } from './permissions.guard.js';
import { SuperAdminGuard } from './super-admin.guard.js';

@Module({ controllers: [AccessControlController], providers: [AccessControlService, PermissionsGuard, SuperAdminGuard], exports: [AccessControlService, PermissionsGuard, SuperAdminGuard] })
export class AccessControlModule {}
