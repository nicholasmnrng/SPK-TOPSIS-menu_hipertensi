"use client";

import { FormEvent, useState } from "react";

type Criterion = {
  id: string;
  code: string;
  name: string;
  unit: string;
  weight: number;
  attribute: "BENEFIT" | "COST";
};

type NewCriterion = Omit<Criterion, "id">;

const MAX_ACTIVE_CRITERIA = 10;

function getApiMessage(payload: { error?: { message?: string; fields?: Record<string, string[]> } }, fallback: string) {
  const fieldMessages = payload.error?.fields
    ? Object.entries(payload.error.fields)
        .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
        .join(" ")
    : "";
  return fieldMessages || payload.error?.message || fallback;
}

function toPercent(weight: number) {
  return Number((weight * 100).toFixed(4));
}

export function CriteriaManager({ initialCriteria }: { initialCriteria: Criterion[] }) {
  const [items, setItems] = useState(initialCriteria);
  const [message, setMessage] = useState("");
  const [newCriterion, setNewCriterion] = useState<NewCriterion>({
    code: "",
    name: "",
    unit: "",
    weight: 0.01,
    attribute: "BENEFIT",
  });
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const delta = 1 - total;
  const isTotalValid = Math.abs(delta) <= 0.000001;
  const canSave = isTotalValid && items.length > 0 && items.every((item) => item.code && item.name && item.unit);

  function updateItem(index: number, patch: Partial<Criterion>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    setItems(next);
  }

  function splitEvenly() {
    if (items.length === 0) return;
    const totalBasisPoints = 10000;
    const base = Math.floor(totalBasisPoints / items.length);
    const remainder = totalBasisPoints % items.length;
    setItems(items.map((item, index) => ({
      ...item,
      weight: (base + (index < remainder ? 1 : 0)) / totalBasisPoints,
    })));
  }

  async function addCriterion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/criteria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCriterion),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(getApiMessage(payload, "Gagal menambah kriteria."));
      return;
    }
    setItems([...items, {
      id: payload.data.id,
      code: payload.data.code,
      name: payload.data.name,
      unit: payload.data.unit,
      weight: payload.data.weight,
      attribute: payload.data.attribute,
    }]);
    setNewCriterion({ code: "", name: "", unit: "", weight: 0.01, attribute: "BENEFIT" });
    setMessage("Kriteria ditambahkan. Sesuaikan bobot hingga total 100% sebelum menjalankan ranking.");
  }

  async function save() {
    setMessage("");
    for (const item of items) {
      const response = await fetch(`/api/criteria/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: item.code,
          name: item.name,
          unit: item.unit,
          weight: item.weight,
          attribute: item.attribute,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(getApiMessage(payload, `Gagal menyimpan ${item.name}.`));
        return;
      }
    }

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
    setMessage(response.ok ? payload.message : getApiMessage(payload, "Gagal menyimpan konfigurasi."));
  }

  async function deleteCriterion(item: Criterion) {
    if (!window.confirm(`Hapus kriteria ${item.name}?`)) return;
    setMessage("");
    const response = await fetch(`/api/criteria/${item.id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(getApiMessage(payload, "Gagal menghapus kriteria."));
      return;
    }
    setItems(items.filter((candidate) => candidate.id !== item.id));
    setMessage("Kriteria dihapus. Sesuaikan ulang bobot hingga total 100%.");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addCriterion} className="rounded-lg border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1.4fr_0.8fr_0.8fr_0.9fr_auto]">
          <input
            value={newCriterion.code}
            onChange={(event) => setNewCriterion({ ...newCriterion, code: event.target.value.toUpperCase() })}
            placeholder="Kode"
            required
            maxLength={50}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            value={newCriterion.name}
            onChange={(event) => setNewCriterion({ ...newCriterion, name: event.target.value })}
            placeholder="Nama kriteria"
            required
            maxLength={100}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            value={newCriterion.unit}
            onChange={(event) => setNewCriterion({ ...newCriterion, unit: event.target.value })}
            placeholder="Satuan"
            required
            maxLength={20}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            value={toPercent(newCriterion.weight)}
            onChange={(event) => setNewCriterion({ ...newCriterion, weight: Number(event.target.value) / 100 })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <select
            value={newCriterion.attribute}
            onChange={(event) => setNewCriterion({ ...newCriterion, attribute: event.target.value as "BENEFIT" | "COST" })}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="BENEFIT">BENEFIT</option>
            <option value="COST">COST</option>
          </select>
          <button
            disabled={items.length >= MAX_ACTIVE_CRITERIA}
            className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Tambah
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-muted/70 text-left">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Kriteria</th>
                <th className="px-4 py-3">Satuan</th>
                <th className="px-4 py-3">Bobot (%)</th>
                <th className="px-4 py-3">Atribut</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">
                    <input
                      value={item.code}
                      onChange={(event) => updateItem(index, { code: event.target.value.toUpperCase() })}
                      className="w-36 rounded-md border px-3 py-2 font-mono text-xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={item.name}
                      onChange={(event) => updateItem(index, { name: event.target.value })}
                      className="w-56 rounded-md border px-3 py-2"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={item.unit}
                      onChange={(event) => updateItem(index, { unit: event.target.value })}
                      className="w-28 rounded-md border px-3 py-2"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      value={toPercent(item.weight)}
                      onChange={(event) => updateItem(index, { weight: Number(event.target.value) / 100 })}
                      className="w-28 rounded-md border px-3 py-2"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={item.attribute}
                      onChange={(event) => updateItem(index, { attribute: event.target.value as "BENEFIT" | "COST" })}
                      className="rounded-md border px-3 py-2"
                    >
                      <option value="BENEFIT">BENEFIT</option>
                      <option value="COST">COST</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteCriterion(item)} className="text-rose-700 hover:underline">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4">
        <div>
          <p className="font-medium">Total bobot: {(total * 100).toFixed(2)}%</p>
          <p className="text-sm text-muted-foreground">
            {isTotalValid
              ? "Total bobot sudah 100%."
              : delta > 0
                ? `Sisa bobot ${(delta * 100).toFixed(2)}%.`
                : `Kelebihan bobot ${Math.abs(delta * 100).toFixed(2)}%.`}
          </p>
          <p className="text-xs text-muted-foreground">{items.length}/{MAX_ACTIVE_CRITERIA} kriteria aktif.</p>
          {message ? <p className="mt-1 text-sm text-emerald-700">{message}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={splitEvenly} className="rounded-md border px-4 py-2 text-sm font-medium">
            Bagi Rata
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Simpan Konfigurasi
          </button>
        </div>
      </div>
    </div>
  );
}
