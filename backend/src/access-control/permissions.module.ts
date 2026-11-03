import { Module } from '@nestjs/common';
import { AccessControlModule } from './access-control.module.js';
import { AdministrationService } from './administration.service.js';
import { PermissionsController } from './permissions.controller.js';

@Module({ imports: [AccessControlModule], controllers: [PermissionsController], providers: [AdministrationService] })
export class PermissionsModule {}
