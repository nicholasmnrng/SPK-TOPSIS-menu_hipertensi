import { prisma } from "@/lib/db/prisma";

export async function getMonitoringSnapshot() {
  const startedAt = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const latencyMs = Math.round(performance.now() - startedAt);

  const [
    pendingAccounts,
    activeAccounts,
    suspendedAccounts,
    activeSessions,
    importRuns,
    rankingRuns,
    exportCount,
    recentErrors,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING", deletedAt: null } }),
    prisma.user.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.user.count({ where: { status: "SUSPENDED", deletedAt: null } }),
    prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.importRun.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.rankingRun.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.auditLog.count({ where: { action: "EXPORT_REPORT" } }),
    prisma.auditLog.findMany({
      where: { action: "SYSTEM_ERROR" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  await prisma.healthCheck.create({
    data: {
      status: "UP",
      database: "UP",
      latencyMs,
      message: "Database query berhasil.",
    },
  });

  return {
    status: "UP",
    database: "UP",
    latencyMs,
    accounts: { pending: pendingAccounts, active: activeAccounts, suspended: suspendedAccounts },
    activeSessions,
    importRuns,
    rankingRuns,
    exportCount,
    recentErrors,
    recentActivity,
    checkedAt: new Date().toISOString(),
  };
}
