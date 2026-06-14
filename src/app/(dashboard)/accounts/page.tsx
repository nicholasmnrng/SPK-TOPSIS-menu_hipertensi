import { AccountsManager } from "@/components/admin/accounts-manager";
import { PageHeader } from "@/components/shared/page-header";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { prisma } from "@/lib/db/prisma";

export default async function AccountsPage() {
  await requirePageUser("users:manage");
  const accounts = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      banned: true,
      banReason: true,
      approvedAt: true,
      createdAt: true,
      _count: { select: { sessions: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return (
    <>
      <PageHeader title="Manajemen Akun" description="Setujui registrasi Ahli Gizi, atur status akun, reset password, dan cabut sesi." />
      <main className="p-6">
        <AccountsManager initialAccounts={accounts.map((account) => ({
          ...account,
          approvedAt: account.approvedAt?.toISOString() ?? null,
          createdAt: account.createdAt.toISOString(),
        }))} />
      </main>
    </>
  );
}
