"use client";

import { useState } from "react";

type Criterion = {
  id: string;
  code: string;
  name: string;
  unit: string;
  weight: number;
  attribute: "BENEFIT" | "COST";
};

export function CriteriaManager({ initialCriteria }: { initialCriteria: Criterion[] }) {
  const [items, setItems] = useState(initialCriteria);
  const [message, setMessage] = useState("");
  const total = items.reduce((sum, item) => sum + item.weight, 0);

  async function save() {
    setMessage("");
    const response = await fetch("/api/criteria", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          id: item.id,
          weight: item.weight,
          attribute: item.attribute,
        })),
      }),
    });
    const payload = await response.json();
    setMessage(response.ok ? payload.message : payload.error?.message ?? "Gagal menyimpan.");
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/70 text-left">
            <tr>
              <th className="px-4 py-3">Kriteria</th>
              <th className="px-4 py-3">Satuan</th>
              <th className="px-4 py-3">Bobot (%)</th>
              <th className="px-4 py-3">Atribut</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{item.code}</p>
                </td>
                <td className="px-4 py-3">{item.unit} / 100 g</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={Number((item.weight * 100).toFixed(4))}
                    onChange={(event) => {
                      const next = [...items];
                      next[index] = { ...item, weight: Number(event.target.value) / 100 };
                      setItems(next);
                    }}
                    className="w-28 rounded-md border px-3 py-2"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={item.attribute}
                    onChange={(event) => {
                      const next = [...items];
                      next[index] = { ...item, attribute: event.target.value as "BENEFIT" | "COST" };
                      setItems(next);
                    }}
                    className="rounded-md border px-3 py-2"
                  >
                    <option value="BENEFIT">BENEFIT</option>
                    <option value="COST">COST</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div>
          <p className="font-medium">Total bobot: {(total * 100).toFixed(2)}%</p>
          <p className="text-sm text-muted-foreground">Total wajib tepat 100% sebelum disimpan.</p>
          {message ? <p className="mt-1 text-sm text-emerald-700">{message}</p> : null}
        </div>
        <button
          onClick={save}
          disabled={Math.abs(total - 1) > 0.000001}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Simpan Konfigurasi
        </button>
      </div>
    </div>
  );
}
