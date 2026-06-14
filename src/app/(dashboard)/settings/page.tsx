import { PageHeader } from "@/components/shared/page-header";
import { requirePageUser } from "@/lib/auth/require-page-user";

export default async function SettingsPage() {
  const user = await requirePageUser("profile:update");
  return (
    <>
      <PageHeader title="Profil" description="Informasi akun dan akses aplikasi." />
      <main className="p-6">
        <section className="max-w-2xl rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Profil Pengguna</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Nama</dt><dd className="font-medium">{user.name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{user.email}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Role</dt><dd className="font-medium">{user.role === "USER" ? "USER (Ahli Gizi)" : "ADMIN"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Status</dt><dd className="font-medium">{user.status}</dd></div>
          </dl>
        </section>
      </main>
    </>
  );
}
