import { EAccountPermissions } from '../enums/account/permission.account.enum';
import { EAccountRoles } from '../enums/account/roles.account.enum';

export const AccessControl = {
    [EAccountRoles.SUPER_ADMIN]: [
        EAccountPermissions.MANAGE_ACCOUNTS,
        EAccountPermissions.MANAGE_CLIENTS,
        EAccountPermissions.MANAGE_SESSIONS,
        EAccountPermissions.MANAGE_TOKENS,
        EAccountPermissions.ACCESS_ANALYTICS,
        EAccountPermissions.ACCESS_BASIC_FEATURES,
        EAccountPermissions.VIEW_REPORTS,
        EAccountPermissions.VIEW_OWN_DATA,
    ],
    [EAccountRoles.ADMIN]: [
        EAccountPermissions.MANAGE_CLIENTS,
        EAccountPermissions.MANAGE_SESSIONS,
        EAccountPermissions.MANAGE_TOKENS,
        EAccountPermissions.ACCESS_ANALYTICS,
        EAccountPermissions.ACCESS_BASIC_FEATURES,
        EAccountPermissions.VIEW_REPORTS,
        EAccountPermissions.VIEW_OWN_DATA,
    ],
    [EAccountRoles.MANAGER]: [EAccountPermissions.ACCESS_ANALYTICS, EAccountPermissions.VIEW_REPORTS, EAccountPermissions.VIEW_OWN_DATA],
    [EAccountRoles.MODERATOR]: [EAccountPermissions.READ_ONLY_ACCESS],
    [EAccountRoles.ANALYST]: [EAccountPermissions.ACCESS_ANALYTICS],
    [EAccountRoles.SUPPORT]: [EAccountPermissions.VIEW_REPORTS],
    [EAccountRoles.USER]: [EAccountPermissions.READ_ONLY_ACCESS],
    [EAccountRoles.CLIENT]: [EAccountPermissions.VIEW_OWN_DATA],
    [EAccountRoles.PARTNER]: [EAccountPermissions.ACCESS_BASIC_FEATURES],
};
