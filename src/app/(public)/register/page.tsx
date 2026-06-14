"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error?.message ?? "Registrasi gagal.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Registrasi berhasil. Akun menunggu persetujuan Admin.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm text-emerald-600">REGISTRASI AHLI GIZI</p>
        <h1 className="mt-1 text-2xl font-semibold">Buat akun</h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="text-sm font-medium">Nama</span>
            <input name="name" required minLength={2} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <button disabled={loading} className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>
        <Link href="/login" className="mt-5 block text-center text-sm text-emerald-700 hover:underline">
          Kembali ke login
        </Link>
      </div>
    </main>
  );
}
