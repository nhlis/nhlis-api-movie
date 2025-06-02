import { SetMetadata } from '@nestjs/common';
import { EAccountPermissions } from '../enums/account/permission.account.enum';

export const Permissions = (...permissions: EAccountPermissions[]) => SetMetadata('permissions', permissions);
