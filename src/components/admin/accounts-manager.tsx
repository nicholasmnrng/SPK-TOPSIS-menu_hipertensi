"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/utils";

type Account = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  banned: boolean | null;
  banReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  _count: { sessions: number };
};

export function AccountsManager({ initialAccounts }: { initialAccounts: Account[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [message, setMessage] = useState("");

  async function reload() {
    const response = await fetch("/api/admin/accounts");
    const payload = await response.json();
    if (response.ok) setAccounts(payload.data);
  }

  async function runAction(userId: string, action: string, extra: Record<string, string> = {}) {
    setMessage("");
    const response = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, ...extra }),
    });
    const payload = await response.json();
    setMessage(response.ok ? payload.message : payload.error?.message ?? "Aksi akun gagal.");
    if (response.ok) await reload();
  }

  function resetPassword(account: Account) {
    const password = window.prompt(`Password baru untuk ${account.email} (minimal 8 karakter):`);
    if (password) void runAction(account.id, "RESET_PASSWORD", { password });
  }

  function suspend(account: Account) {
    const reason = window.prompt(`Alasan penangguhan ${account.email}:`, "Ditangguhkan oleh Admin");
    if (reason !== null) void runAction(account.id, "SUSPEND", { reason });
  }

  return (
    <div className="space-y-4">
      {message ? <p className="rounded-md border bg-card p-3 text-sm">{message}</p> : null}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-muted/70 text-left">
              <tr>
                <th className="px-4 py-3">Akun</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sesi</th>
                <th className="px-4 py-3">Terdaftar</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-t align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{account.name ?? "Tanpa nama"}</p>
                    <p className="text-xs text-muted-foreground">{account.email}</p>
                    {account.banReason ? <p className="mt-1 text-xs text-rose-700">{account.banReason}</p> : null}
                  </td>
                  <td className="px-4 py-3">{account.role}</td>
                  <td className="px-4 py-3">{account.status}</td>
                  <td className="px-4 py-3">{account._count.sessions}</td>
                  <td className="px-4 py-3">{formatDateTime(account.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {account.status === "PENDING" ? (
                        <button onClick={() => runAction(account.id, "APPROVE")} className="rounded border px-2 py-1 hover:bg-muted">
                          Aktifkan
                        </button>
                      ) : null}
                      {account.status === "ACTIVE" && account.role !== "ADMIN" ? (
                        <button onClick={() => suspend(account)} className="rounded border px-2 py-1 hover:bg-muted">
                          Tangguhkan
                        </button>
                      ) : null}
                      {account.status === "SUSPENDED" ? (
                        <button onClick={() => runAction(account.id, "ACTIVATE")} className="rounded border px-2 py-1 hover:bg-muted">
                          Aktifkan
                        </button>
                      ) : null}
                      <button onClick={() => resetPassword(account)} className="rounded border px-2 py-1 hover:bg-muted">
                        Reset password
                      </button>
                      <button onClick={() => runAction(account.id, "REVOKE_SESSIONS")} className="rounded border px-2 py-1 hover:bg-muted">
                        Cabut sesi
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
