// Role-based access control (RBAC) system

export enum UserRole {
  USER = "user",
  MODERATOR = "moderator",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export enum Permission {
  // User permissions
  READ_OWN_PROFILE = "read_own_profile",
  UPDATE_OWN_PROFILE = "update_own_profile",
  CREATE_TODO = "create_todo",
  READ_OWN_TODOS = "read_own_todos",
  UPDATE_OWN_TODOS = "update_own_todos",
  DELETE_OWN_TODOS = "delete_own_todos",

  // Moderator permissions
  READ_ALL_TODOS = "read_all_todos",
  DELETE_ANY_TODO = "delete_any_todo",
  MODERATE_CONTENT = "moderate_content",

  // Admin permissions
  READ_ALL_USERS = "read_all_users",
  UPDATE_USER_ROLES = "update_user_roles",
  DELETE_USERS = "delete_users",
  MANAGE_SYSTEM_SETTINGS = "manage_system_settings",

  // Super Admin permissions
  MANAGE_ADMINS = "manage_admins",
  SYSTEM_MAINTENANCE = "system_maintenance",
  ACCESS_LOGS = "access_logs",
}

// Base permissions for each role
const USER_PERMISSIONS: Permission[] = [
  Permission.READ_OWN_PROFILE,
  Permission.UPDATE_OWN_PROFILE,
  Permission.CREATE_TODO,
  Permission.READ_OWN_TODOS,
  Permission.UPDATE_OWN_TODOS,
  Permission.DELETE_OWN_TODOS,
];

const MODERATOR_PERMISSIONS: Permission[] = [
  ...USER_PERMISSIONS,
  Permission.READ_ALL_TODOS,
  Permission.DELETE_ANY_TODO,
  Permission.MODERATE_CONTENT,
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...MODERATOR_PERMISSIONS,
  Permission.READ_ALL_USERS,
  Permission.UPDATE_USER_ROLES,
  Permission.DELETE_USERS,
  Permission.MANAGE_SYSTEM_SETTINGS,
];

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  Permission.MANAGE_ADMINS,
  Permission.SYSTEM_MAINTENANCE,
  Permission.ACCESS_LOGS,
];

// Role hierarchy and permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: USER_PERMISSIONS,
  [UserRole.MODERATOR]: MODERATOR_PERMISSIONS,
  [UserRole.ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.SUPER_ADMIN]: SUPER_ADMIN_PERMISSIONS,
};

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

// Helper functions
export const hasPermission = (
  userRole: UserRole,
  permission: Permission
): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission);
};

export const hasRole = (
  userRole: UserRole,
  requiredRole: UserRole
): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const canAccessResource = (
  userRole: UserRole,
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.every((permission) =>
    hasPermission(userRole, permission)
  );
};

export const getRoleDisplayName = (role: UserRole): string => {
  const displayNames: Record<UserRole, string> = {
    [UserRole.USER]: "User",
    [UserRole.MODERATOR]: "Moderator",
    [UserRole.ADMIN]: "Administrator",
    [UserRole.SUPER_ADMIN]: "Super Administrator",
  };
  return displayNames[role];
};

export const getRoleBadgeColor = (role: UserRole): string => {
  const colors: Record<UserRole, string> = {
    [UserRole.USER]: "bg-green-100 text-green-800",
    [UserRole.MODERATOR]: "bg-blue-100 text-blue-800",
    [UserRole.ADMIN]: "bg-purple-100 text-purple-800",
    [UserRole.SUPER_ADMIN]: "bg-red-100 text-red-800",
  };
  return colors[role];
};
