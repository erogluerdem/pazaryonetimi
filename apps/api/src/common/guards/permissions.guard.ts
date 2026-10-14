import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { RBACService, Permission } from '../../modules/rbac/rbac.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RBACService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: { id?: string; type?: string } }>();
    const user = request.user;
    if (!user?.id) throw new ForbiddenException('Kullanıcı oturumu gerekli');

    if (user.type === 'SUPERADMIN' || user.type === 'ADMIN') {
      return true;
    }

    for (const permission of required) {
      const allowed = await this.rbacService.hasPermission(user.id, permission);
      if (!allowed) {
        throw new ForbiddenException(`Bu işlem için yetkiniz yok (${permission})`);
      }
    }

    return true;
  }
}
