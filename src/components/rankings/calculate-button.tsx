"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CalculateButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    const response = await fetch("/api/topsis/calculate", { method: "POST" });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(payload.error?.message ?? "Perhitungan gagal.");
      return;
    }
    router.push(`/rankings/${payload.rankingRunId}`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {message ? <span className="text-sm text-rose-600">{message}</span> : null}
      <button onClick={calculate} disabled={loading} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {loading ? "Menghitung..." : "Hitung Ulang TOPSIS"}
      </button>
    </div>
  );
}
