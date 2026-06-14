export type AppRole = "ADMIN" | "USER";

export type Permission =
  | "dashboard:read"
  | "users:manage"
  | "monitoring:read"
  | "audit:read"
  | "criteria:manage"
  | "guidelines:manage"
  | "foods:manage"
  | "imports:manage"
  | "topsis:calculate"
  | "rankings:read"
  | "reports:export"
  | "profile:update";

const rolePermissions: Record<AppRole, Permission[]> = {
  ADMIN: [
    "dashboard:read",
    "users:manage",
    "monitoring:read",
    "audit:read",
    "profile:update",
  ],
  USER: [
    "dashboard:read",
    "criteria:manage",
    "guidelines:manage",
    "foods:manage",
    "imports:manage",
    "topsis:calculate",
    "rankings:read",
    "reports:export",
    "profile:update",
  ],
};

export function isAppRole(value: string | null | undefined): value is AppRole {
  return value === "ADMIN" || value === "USER";
}

export function hasPermission(role: AppRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function assertPermission(role: AppRole, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new AuthorizationError(`Forbidden: missing permission ${permission}`, 403);
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 = 403,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export { rolePermissions };
