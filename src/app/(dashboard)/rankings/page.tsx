import Link from "next/link";
import { RankingChart } from "@/components/charts/ranking-chart";
import { CalculateButton } from "@/components/rankings/calculate-button";
import { PageHeader } from "@/components/shared/page-header";
import { PreferenceBadge } from "@/components/shared/preference-badge";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { getRanking, getRankingHistory } from "@/server/services/topsis-service";

export default async function RankingsPage() {
  await requirePageUser("rankings:read");
  const [ranking, history] = await Promise.all([getRanking(), getRankingHistory()]);

  return (
    <>
      <PageHeader
        title="Ranking Makanan"
        description="Peringkat TOPSIS berdasarkan konfigurasi kriteria dan data lengkap saat kalkulasi."
        action={<CalculateButton />}
      />
      <main className="space-y-6 p-6">
        {!ranking ? (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            Belum ada hasil ranking. Jalankan kalkulasi setelah data makanan dan bobot kriteria siap.
          </div>
        ) : (
          <>
            <RankingChart data={ranking.results.slice(0, 15).map((item) => ({ alternativeName: item.foodName, preference: item.preference }))} />
            <div className="overflow-hidden rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <h2 className="font-semibold">Hasil Terbaru</h2>
                  <p className="text-xs text-muted-foreground">{formatDateTime(ranking.createdAt)}</p>
                </div>
                <Link href={`/rankings/${ranking.rankingRunId}`} className="text-sm font-medium text-emerald-700 hover:underline">
                  Detail perhitungan
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-muted/70 text-left">
                    <tr><th className="px-4 py-3">Rank</th><th className="px-4 py-3">Makanan</th><th className="px-4 py-3">D+</th><th className="px-4 py-3">D-</th><th className="px-4 py-3">Vi</th><th className="px-4 py-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {ranking.results.map((item) => (
                      <tr key={item.foodId} className="border-t">
                        <td className="px-4 py-3">#{item.rank}</td>
                        <td className="px-4 py-3 font-medium">{item.foodName}</td>
                        <td className="px-4 py-3">{formatNumber(item.dPositive, 6)}</td>
                        <td className="px-4 py-3">{formatNumber(item.dNegative, 6)}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">{formatNumber(item.preference, 6)}</td>
                        <td className="px-4 py-3"><PreferenceBadge value={item.preference} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Riwayat Kalkulasi</h2>
          <div className="mt-3 divide-y text-sm">
            {history.map((run) => (
              <Link key={run.id} href={`/rankings/${run.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-emerald-700">
                <span>{formatDateTime(run.createdAt)} | {run._count.results} makanan</span>
                <span>{run.results[0]?.food.name ?? "-"} ({run.results[0] ? formatNumber(run.results[0].preference, 6) : "-"})</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
