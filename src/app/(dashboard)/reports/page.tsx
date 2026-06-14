import { FileDown } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { getRanking } from "@/server/services/topsis-service";
import { formatDateTime } from "@/lib/utils";

export default async function ReportsPage() {
  await requirePageUser("reports:export");
  const ranking = await getRanking();
  const query = ranking ? `?rankingRunId=${ranking.rankingRunId}` : "";
  return (
    <>
      <PageHeader title="Laporan" description="Unduh snapshot ranking lengkap untuk dokumentasi dan audit." />
      <main className="p-6">
        {!ranking ? (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Belum ada ranking yang dapat diekspor.</div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">Ranking terbaru: {formatDateTime(ranking.createdAt)}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-5">
                <FileDown className="h-6 w-6 text-emerald-600" />
                <h2 className="mt-4 font-semibold">Laporan PDF</h2>
                <p className="mt-2 text-sm text-muted-foreground">Metadata, bobot, hasil, data mentah, justifikasi, disclaimer, dan sumber.</p>
                <a href={`/api/reports/rankings.pdf${query}`} className="mt-5 inline-block rounded-md border px-4 py-2 text-sm hover:bg-muted">Download PDF</a>
              </div>
              <div className="rounded-lg border bg-card p-5">
                <FileDown className="h-6 w-6 text-sky-600" />
                <h2 className="mt-4 font-semibold">Workbook Excel</h2>
                <p className="mt-2 text-sm text-muted-foreground">Sheet Ringkasan, Ranking, Data Gizi, Perhitungan TOPSIS, dan Pedoman.</p>
                <a href={`/api/reports/rankings.xlsx${query}`} className="mt-5 inline-block rounded-md border px-4 py-2 text-sm hover:bg-muted">Download Excel</a>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
