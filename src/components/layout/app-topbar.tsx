"use client";

import { useRouter } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { AppSessionUser } from "@/lib/auth/auth";

export function AppTopbar({ user }: { user: AppSessionUser }) {
  const router = useRouter();

  async function logout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex w-full max-w-md items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        <span>Cari data makanan, ranking, atau aktivitas</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
          {user.name} · {user.role}
        </span>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
