import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { getCurrentUser } from "@/lib/auth/auth";
import { AuthorizationError } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401) redirect("/login");
    redirect("/pending");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AppSidebar role={user.role} />
        <div className="min-w-0 flex-1">
          <AppTopbar user={user} />
          {children}
        </div>
      </div>
    </div>
  );
}
