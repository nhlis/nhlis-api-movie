import { SetMetadata } from '@nestjs/common';
import { EAccountRoles } from '../enums/account/roles.account.enum';

export const Roles = (...roles: EAccountRoles[]) => SetMetadata('roles', roles);
