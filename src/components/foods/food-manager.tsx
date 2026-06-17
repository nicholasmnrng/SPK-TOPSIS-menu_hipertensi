"use client";

import { FormEvent, useMemo, useState } from "react";

type Criterion = {
  id: string;
  code: string;
  name: string;
  unit: string;
};

type Food = {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  complete: boolean;
  nutrients: Record<string, { value: number | null; name: string; unit: string }>;
};

type Preview = {
  rows: Array<{
    rowNumber: number;
    name: string;
    nutrients: Record<string, number | string | null>;
    errors: string[];
  }>;
  totalRows: number;
  validRows: number;
  incompleteRows: number;
  errorRows: number;
};

function getApiMessage(payload: { error?: { message?: string; fields?: Record<string, string[]> } }, fallback: string) {
  const fieldMessages = payload.error?.fields
    ? Object.entries(payload.error.fields)
        .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
        .join(" ")
    : "";
  return fieldMessages || payload.error?.message || fallback;
}

export function FoodManager({ criteria, initialFoods }: { criteria: Criterion[]; initialFoods: Food[] }) {
  const [foods, setFoods] = useState(initialFoods);
  const [selected, setSelected] = useState<Food | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const completeCount = useMemo(() => foods.filter((food) => food.complete).length, [foods]);

  async function reload() {
    const response = await fetch("/api/foods");
    const payload = await response.json();
    if (response.ok) setFoods(payload.data);
  }

  async function saveFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    const body = {
      name: form.get("name"),
      description: form.get("description"),
      nutrients: Object.fromEntries(criteria.map((criterion) => [criterion.code, form.get(criterion.code)])),
    };
    const response = await fetch(selected ? `/api/foods/${selected.id}` : "/api/foods", {
      method: selected ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    setMessage(
      response.ok
        ? "Data makanan tersimpan. Jika semua nilai kriteria lengkap, buka menu Ranking lalu klik Hitung Ulang TOPSIS agar masuk ranking terbaru."
        : getApiMessage(payload, "Gagal menyimpan."),
    );
    if (response.ok) {
      setSelected(null);
      target.reset();
      await reload();
    }
  }

  async function previewImport() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/foods/import/preview", { method: "POST", body: form });
    const payload = await response.json();
    if (response.ok) setPreview(payload);
    else setMessage(payload.error?.message ?? "Preview gagal.");
  }

  async function commitImport() {
    if (!file || !preview) return;
    const response = await fetch("/api/foods/import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.name.split(".").pop(),
        rows: preview.rows,
      }),
    });
    const payload = await response.json();
    setMessage(response.ok ? "Impor berhasil disimpan." : payload.error?.message ?? "Impor gagal.");
    if (response.ok) {
      setPreview(null);
      setFile(null);
      await reload();
    }
  }

  async function deleteFood(food: Food) {
    if (!window.confirm(`Hapus ${food.name}?`)) return;
    const response = await fetch(`/api/foods/${food.id}`, { method: "DELETE" });
    const payload = await response.json();
    setMessage(response.ok ? "Data makanan dihapus." : payload.error?.message ?? "Gagal menghapus.");
    if (response.ok) await reload();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Impor Excel / CSV</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Header: Nama Bahan Makanan, {criteria.map((criterion) => criterion.code).join(", ")}.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input type="file" accept=".xlsx,.csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <button onClick={previewImport} disabled={!file} className="rounded-md border px-4 py-2 text-sm disabled:opacity-50">
            Preview
          </button>
          {preview ? (
            <button onClick={commitImport} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
              Konfirmasi Impor
            </button>
          ) : null}
        </div>
        {preview ? (
          <div className="mt-4 rounded-md bg-muted p-4 text-sm">
            Total {preview.totalRows} - Valid {preview.validRows} - Belum lengkap {preview.incompleteRows} - Error {preview.errorRows}
            <div className="mt-3 max-h-96 overflow-auto rounded border bg-background">
              <table className="w-full min-w-[850px] text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-2 py-2 text-left">Baris</th>
                    <th className="px-2 py-2 text-left">Nama</th>
                    {criteria.map((criterion) => <th key={criterion.id} className="px-2 py-2 text-left">{criterion.code}</th>)}
                    <th className="px-2 py-2 text-left">Validasi</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, rowIndex) => (
                    <tr key={row.rowNumber} className="border-t">
                      <td className="px-2 py-2">{row.rowNumber}</td>
                      <td className="px-2 py-2">
                        <input
                          value={row.name}
                          onChange={(event) => {
                            const rows = [...preview.rows];
                            rows[rowIndex] = { ...row, name: event.target.value };
                            setPreview({ ...preview, rows });
                          }}
                          className="w-40 rounded border px-2 py-1"
                        />
                      </td>
                      {criteria.map((criterion) => (
                        <td key={criterion.id} className="px-2 py-2">
                          <input
                            inputMode="decimal"
                            value={row.nutrients[criterion.code] ?? ""}
                            onChange={(event) => {
                              const rows = [...preview.rows];
                              rows[rowIndex] = {
                                ...row,
                                nutrients: { ...row.nutrients, [criterion.code]: event.target.value },
                              };
                              setPreview({ ...preview, rows });
                            }}
                            className="w-24 rounded border px-2 py-1"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2 text-rose-700">{row.errors.join("; ") || "OK"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      <form onSubmit={saveFood} className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{selected ? `Edit ${selected.name}` : "Tambah Makanan Manual"}</h2>
          {selected ? <button type="button" onClick={() => setSelected(null)} className="text-sm text-muted-foreground">Batal</button> : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input name="name" required defaultValue={selected?.name ?? ""} placeholder="Nama makanan" className="rounded-md border px-3 py-2 text-sm" />
          <input name="description" defaultValue={selected?.description ?? ""} placeholder="Deskripsi opsional" className="rounded-md border px-3 py-2 text-sm" />
          {criteria.map((criterion) => (
            <label key={`${selected?.id ?? "new"}-${criterion.id}`} className="text-sm">
              <span>{criterion.name} ({criterion.unit})</span>
              <input
                name={criterion.code}
                inputMode="decimal"
                defaultValue={selected?.nutrients[criterion.code]?.value ?? ""}
                placeholder="0,00"
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </label>
          ))}
        </div>
        <button className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Simpan</button>
        {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
      </form>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Data Makanan ({completeCount}/{foods.length} siap dihitung)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted/70 text-left">
              <tr>
                <th className="px-4 py-3">Makanan</th>
                {criteria.map((criterion) => <th key={criterion.id} className="px-4 py-3">{criterion.code}</th>)}
                <th className="px-4 py-3">Kelengkapan</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {foods.map((food) => (
                <tr key={food.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{food.name}</td>
                  {criteria.map((criterion) => (
                    <td key={criterion.id} className="px-4 py-3">
                      {food.nutrients[criterion.code]?.value ?? "-"} {food.nutrients[criterion.code]?.unit ?? criterion.unit}
                    </td>
                  ))}
                  <td className="px-4 py-3">{food.complete ? "Lengkap" : "Belum lengkap"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => setSelected(food)} className="text-emerald-700 hover:underline">Edit</button>
                      <button onClick={() => deleteFood(food)} className="text-rose-700 hover:underline">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
