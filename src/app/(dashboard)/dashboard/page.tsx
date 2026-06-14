import Link from "next/link";
import { Activity, Clock, Database, Trophy, UserCheck, Users, Utensils } from "lucide-react";
import { RankingChart } from "@/components/charts/ranking-chart";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { prisma } from "@/lib/db/prisma";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { getRanking } from "@/server/services/topsis-service";

export default async function DashboardPage() {
  const user = await requirePageUser("dashboard:read");

  if (user.role === "ADMIN") {
    const [pending, active, sessions, latestActivity] = await Promise.all([
      prisma.user.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.user.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
      prisma.auditLog.findMany({
        include: { actor: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);
    return (
      <>
        <PageHeader title="Dashboard Admin" description="Persetujuan akun dan ringkasan kesehatan operasional sistem." action={<Link href="/monitoring" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Buka Monitoring</Link>} />
        <main className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Akun Pending" value={pending} icon={<Clock className="h-5 w-5" />} />
            <StatCard title="Akun Aktif" value={active} icon={<UserCheck className="h-5 w-5" />} />
            <StatCard title="Sesi Aktif" value={sessions} icon={<Users className="h-5 w-5" />} />
            <StatCard title="Database" value="Terhubung" icon={<Database className="h-5 w-5" />} />
          </div>
          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Aktivitas Terbaru</h2>
            <div className="mt-3 divide-y text-sm">
              {latestActivity.map((item) => (
                <p key={item.id} className="py-3">
                  <span className="font-medium">{item.actor?.name ?? item.actor?.email ?? "Sistem"}</span>
                  {" "}{item.action.toLowerCase().replaceAll("_", " ")} pada {item.entityType}.
                </p>
              ))}
            </div>
          </section>
        </main>
      </>
    );
  }

  const [foodCount, completeFoodCount, criterionCount, ranking] = await Promise.all([
    prisma.food.count({ where: { deletedAt: null } }),
    prisma.food.count({
      where: {
        deletedAt: null,
        nutrients: { every: { value: { not: null } } },
      },
    }),
    prisma.criterion.count({ where: { deletedAt: null } }),
    getRanking(),
  ]);
  return (
    <>
      <PageHeader title="Dashboard Ahli Gizi" description="Ringkasan data gizi dan hasil peringkat TOPSIS terbaru." action={<Link href="/foods" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Kelola Data Makanan</Link>} />
      <main className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Data Makanan" value={foodCount} icon={<Utensils className="h-5 w-5" />} />
          <StatCard title="Siap Dihitung" value={completeFoodCount} description={`${foodCount - completeFoodCount} data belum lengkap`} icon={<Activity className="h-5 w-5" />} />
          <StatCard title="Kriteria" value={criterionCount} icon={<Database className="h-5 w-5" />} />
          <StatCard title="Peringkat Pertama" value={ranking?.results[0]?.foodName ?? "-"} icon={<Trophy className="h-5 w-5" />} />
        </div>
        {ranking ? (
          <RankingChart data={ranking.results.slice(0, 10).map((item) => ({ alternativeName: item.foodName, preference: item.preference }))} />
        ) : (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Belum ada kalkulasi ranking. Buka menu Ranking untuk menjalankan TOPSIS.</div>
        )}
      </main>
    </>
  );
}
