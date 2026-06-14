"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";

type Monitoring = {
  status: string;
  database: string;
  latencyMs: number;
  accounts: { pending: number; active: number; suspended: number };
  activeSessions: number;
  exportCount: number;
  checkedAt: string;
  importRuns: Array<{ id: string; fileName: string; status: string; createdAt: string }>;
  rankingRuns: Array<{ id: string; status: string; createdAt: string }>;
  recentErrors: Array<{ id: string; entityType: string; createdAt: string }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor: { name: string | null; email: string } | null;
  }>;
};

export function MonitoringPanel({ initialData }: { initialData: Monitoring }) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const response = await fetch("/api/admin/monitoring");
      const payload = await response.json();
      if (response.ok) {
        setData(payload);
        setError("");
      } else {
        setError(payload.error?.message ?? "Monitoring gagal diperbarui.");
      }
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["API / Database", `${data.status} / ${data.database}`],
          ["Latensi database", `${data.latencyMs} ms`],
          ["Sesi aktif", data.activeSessions],
          ["Total export", data.exportCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Status Akun</h2>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-amber-50 p-3"><dt className="text-xs">Pending</dt><dd className="text-xl font-semibold">{data.accounts.pending}</dd></div>
            <div className="rounded-md bg-emerald-50 p-3"><dt className="text-xs">Aktif</dt><dd className="text-xl font-semibold">{data.accounts.active}</dd></div>
            <div className="rounded-md bg-rose-50 p-3"><dt className="text-xs">Suspended</dt><dd className="text-xl font-semibold">{data.accounts.suspended}</dd></div>
          </dl>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Riwayat Proses</h2>
          <p className="mt-3 text-sm">Impor terakhir: {data.importRuns[0]?.fileName ?? "-"}</p>
          <p className="mt-2 text-sm">Ranking terakhir: {data.rankingRuns[0] ? formatDateTime(data.rankingRuns[0].createdAt) : "-"}</p>
          <p className="mt-2 text-sm">Error terakhir: {data.recentErrors[0] ? formatDateTime(data.recentErrors[0].createdAt) : "Tidak ada"}</p>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Aktivitas Terbaru</h2>
          <p className="text-xs text-muted-foreground">Diperbarui {formatDateTime(data.checkedAt)}</p>
        </div>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/70 text-left">
            <tr><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Pelaku</th><th className="px-4 py-3">Aksi</th><th className="px-4 py-3">Entitas</th></tr>
          </thead>
          <tbody>
            {data.recentActivity.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">{formatDateTime(item.createdAt)}</td>
                <td className="px-4 py-3">{item.actor?.name ?? item.actor?.email ?? "Sistem"}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.action}</td>
                <td className="px-4 py-3">{item.entityType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
