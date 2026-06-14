import Link from "next/link";
import {
  Activity,
  BookOpen,
  FileDown,
  History,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Trophy,
  UserCog,
  Utensils,
} from "lucide-react";
import { AppRole } from "@/lib/rbac/permissions";

const userNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/criteria", label: "Master Kriteria", icon: SlidersHorizontal },
  { href: "/guidelines", label: "Master Pedoman", icon: BookOpen },
  { href: "/foods", label: "Data Makanan", icon: Utensils },
  { href: "/rankings", label: "Ranking", icon: Trophy },
  { href: "/reports", label: "Laporan", icon: FileDown },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

const adminNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Akun", icon: UserCog },
  { href: "/monitoring", label: "Monitoring", icon: Activity },
  { href: "/audit-logs", label: "Audit Log", icon: History },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function AppSidebar({ role }: { role: AppRole }) {
  const navigation = role === "ADMIN" ? adminNavigation : userNavigation;

  return (
    <aside className="hidden min-h-screen w-64 border-r bg-slate-950 text-slate-100 lg:block">
      <div className="border-b border-slate-800 px-5 py-5">
        <p className="text-sm text-emerald-300">SPK TOPSIS</p>
        <h1 className="mt-1 text-lg font-semibold">Menu Hipertensi</h1>
        <p className="mt-1 text-xs text-slate-400">
          {role === "ADMIN" ? "Administrasi Sistem" : "Workspace Ahli Gizi"}
        </p>
      </div>
      <nav className="space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
