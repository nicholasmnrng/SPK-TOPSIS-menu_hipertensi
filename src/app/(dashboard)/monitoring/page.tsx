import { MonitoringPanel } from "@/components/admin/monitoring-panel";
import { PageHeader } from "@/components/shared/page-header";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { getMonitoringSnapshot } from "@/server/services/monitoring-service";

export default async function MonitoringPage() {
  await requirePageUser("monitoring:read");
  const data = await getMonitoringSnapshot();
  const initialData = {
    ...data,
    importRuns: data.importRuns.map((item) => ({ id: item.id, fileName: item.fileName, status: item.status, createdAt: item.createdAt.toISOString() })),
    rankingRuns: data.rankingRuns.map((item) => ({ id: item.id, status: item.status, createdAt: item.createdAt.toISOString() })),
    recentErrors: data.recentErrors.map((item) => ({ id: item.id, entityType: item.entityType, createdAt: item.createdAt.toISOString() })),
    recentActivity: data.recentActivity.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entityType,
      createdAt: item.createdAt.toISOString(),
      actor: item.actor,
    })),
  };
  return (
    <>
      <PageHeader title="Monitoring Sistem" description="Status database dan API diperbarui otomatis setiap 30 detik." />
      <main className="p-6">
        <MonitoringPanel initialData={initialData} />
      </main>
    </>
  );
}
