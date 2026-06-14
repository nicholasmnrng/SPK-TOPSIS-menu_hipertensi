"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

export default function PendingPage() {
  const router = useRouter();

  async function logout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="max-w-lg rounded-lg border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-amber-700">AKSES BELUM TERSEDIA</p>
        <h1 className="mt-2 text-2xl font-semibold">Akun menunggu persetujuan Admin</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Setelah akun disetujui, silakan login kembali. Akun yang ditangguhkan juga diarahkan
          ke halaman ini.
        </p>
        <button onClick={logout} className="mt-6 rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Keluar
        </button>
      </section>
    </main>
  );
}
