import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EAccountPermissions } from '../enums/account/permission.account.enum';
import { EAccountRoles } from '../enums/account/roles.account.enum';
import { AccessControl } from '../mapping/access-control';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest();
        const requiredRoles = this.reflector.getAllAndOverride<EAccountRoles[]>('roles', [context.getHandler(), context.getClass()]);
        const requiredPermissions = this.reflector.getAllAndOverride<EAccountPermissions[]>('permissions', [context.getHandler(), context.getClass()]);
        // Kiểm tra vai trò (roles)
        if (requiredRoles) {
            const hasRole = requiredRoles.some((role) => user.roles.includes(role));
            if (!hasRole) {
                throw new ForbiddenException('Access denied. You do not have the required roles.');
            }
        }
        // Kiểm tra quyền (permissions)
        if (requiredPermissions) {
            const userPermissions = user.roles.flatMap((role: string) => AccessControl[role] || []);
            const hasPermission = requiredPermissions.some((permission) => userPermissions.includes(permission));
            if (!hasPermission) {
                throw new ForbiddenException('Access denied. You do not have the required permissions.');
            }
        }

        return true;
    }
}
