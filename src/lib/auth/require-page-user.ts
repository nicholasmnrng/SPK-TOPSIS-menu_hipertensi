import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth";
import { hasPermission, Permission } from "@/lib/rbac/permissions";

export async function requirePageUser(permission?: Permission) {
  const user = await getCurrentUser();
  if (permission && !hasPermission(user.role, permission)) redirect("/dashboard");
  return user;
}
