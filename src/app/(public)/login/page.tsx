"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Email atau password tidak valid.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm text-emerald-600">SPK TOPSIS</p>
        <h1 className="mt-1 text-2xl font-semibold">Masuk ke aplikasi</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Akun Ahli Gizi harus disetujui Admin sebelum dapat mengakses dashboard.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="block w-full rounded-md bg-emerald-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Belum memiliki akun?{" "}
          <Link href="/register" className="font-medium text-emerald-700 hover:underline">
            Daftar sebagai Ahli Gizi
          </Link>
        </p>
      </div>
    </main>
  );
}
