import { PageHeader } from "@/components/shared/page-header";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { prisma } from "@/lib/db/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function AuditLogsPage() {
  await requirePageUser("audit:read");
  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeader title="Audit Log" description="Jejak registrasi, persetujuan akun, impor, kalkulasi, export, dan aktivitas sistem." />
      <main className="p-6">
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-muted/70 text-left">
                <tr><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Pelaku</th><th className="px-4 py-3">Aksi</th><th className="px-4 py-3">Entitas</th><th className="px-4 py-3">ID</th></tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-3">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3">{log.actor?.name ?? log.actor?.email ?? "Sistem"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3">{log.entityType}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.entityId ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
