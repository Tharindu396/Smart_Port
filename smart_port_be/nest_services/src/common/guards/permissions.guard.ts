import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission, hasAnyPermission } from '../utils/permissions.util';
import { Role } from '../enums/role.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (!user.role) {
      throw new ForbiddenException('User role not found');
    }

    const hasPermissionAccess = hasAnyPermission(user.role as Role, requiredPermissions);

    if (!hasPermissionAccess) {
      throw new ForbiddenException(
        `User with role '${user.role}' does not have the required permissions. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
