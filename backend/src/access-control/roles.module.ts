import { Module } from '@nestjs/common';
import { AccessControlModule } from './access-control.module.js';
import { AdministrationService } from './administration.service.js';
import { RolesController } from './roles.controller.js';
import { UsersRolesController } from './users-roles.controller.js';

@Module({ imports: [AccessControlModule], controllers: [RolesController, UsersRolesController], providers: [AdministrationService] })
export class RolesModule {}
