import { notFound } from "next/navigation";
import { MatrixTable } from "@/components/topsis/matrix-table";
import { PageHeader } from "@/components/shared/page-header";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { TopsisCriterion, TopsisMatrixRow } from "@/lib/topsis";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { getRanking, RankingJustification } from "@/server/services/topsis-service";

type GuidelineSnapshot = {
  code: string;
  title: string;
  issuer: string;
  year: number;
  url: string;
};

export default async function RankingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser("rankings:read");
  const { id } = await params;
  const ranking = await getRanking(id);
  if (!ranking) notFound();

  const criteria = ranking.criteriaSnapshot as unknown as TopsisCriterion[];
  const rawMatrix = ranking.matrixSnapshot as unknown as TopsisMatrixRow[];
  const normalized = ranking.normalizedMatrix as unknown as TopsisMatrixRow[];
  const weighted = ranking.weightedMatrix as unknown as TopsisMatrixRow[];
  const guidelines = ranking.guidelineSnapshot as unknown as GuidelineSnapshot[];

  return (
    <>
      <PageHeader title="Detail Ranking TOPSIS" description={`Snapshot kalkulasi ${formatDateTime(ranking.createdAt)}. Nilai dan pedoman tidak berubah walau master data diedit kemudian.`} />
      <main className="space-y-6 p-6">
        <section className="rounded-lg border bg-amber-50 p-4 text-sm text-amber-950">{ranking.disclaimer}</section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {criteria.map((criterion) => (
            <div key={criterion.id} className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium">{criterion.name}</p>
              <p className="mt-2 text-xl font-semibold">{criterion.weight * 100}%</p>
              <p className="text-xs text-muted-foreground">{criterion.attribute}</p>
            </div>
          ))}
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Justifikasi Peringkat</h2>
          {ranking.results.map((item) => {
            const justification = item.justification as unknown as RankingJustification;
            return (
              <article key={item.foodId} className="rounded-lg border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-sm text-muted-foreground">Peringkat #{item.rank}</p><h3 className="text-lg font-semibold">{item.foodName}</h3></div>
                  <p className="text-xl font-semibold text-emerald-700">Vi {formatNumber(item.preference, 6)}</p>
                </div>
                <p className="mt-3 text-sm">{justification.summary}</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Faktor pendukung</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {justification.strengths.map((factor) => <li key={factor.criterionCode}>- {factor.message} Sumber: {factor.guidelineCodes.join(", ") || "konfigurasi kriteria"}.</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Catatan kehati-hatian</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {justification.cautions.length ? justification.cautions.map((factor) => <li key={factor.criterionCode}>- {factor.message}</li>) : <li>Tidak ada faktor yang melampaui arah median yang tidak diinginkan.</li>}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <MatrixTable title="Matriks Keputusan (Nilai Gizi per 100 g)" criteria={criteria} rows={rawMatrix} />
        <MatrixTable title="Matriks Normalisasi" criteria={criteria} rows={normalized} />
        <MatrixTable title="Matriks Normalisasi Terbobot" criteria={criteria} rows={weighted} />

        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Pedoman dalam Snapshot</h2>
          <div className="mt-3 space-y-3">
            {guidelines.map((guideline) => (
              <p key={guideline.code} className="text-sm">
                <a href={guideline.url} target="_blank" rel="noreferrer" className="font-medium text-sky-700 hover:underline">{guideline.code}</a>
                {" "}{guideline.title}, {guideline.issuer} ({guideline.year})
              </p>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
