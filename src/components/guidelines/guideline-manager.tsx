"use client";

import { FormEvent, useState } from "react";

type Guideline = {
  id: string;
  code: string;
  title: string;
  issuer: string;
  year: number;
  url: string;
  summary: string;
};

type Criterion = { id: string; name: string };

export function GuidelineManager({
  initialGuidelines,
  criteria,
}: {
  initialGuidelines: Guideline[];
  criteria: Criterion[];
}) {
  const [items, setItems] = useState(initialGuidelines);
  const [message, setMessage] = useState("");

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    const response = await fetch("/api/guidelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.get("code"),
        title: form.get("title"),
        issuer: form.get("issuer"),
        year: form.get("year"),
        url: form.get("url"),
        summary: form.get("summary"),
        criterionIds: form.getAll("criterionIds"),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error?.message ?? "Gagal menambah pedoman.");
      return;
    }
    setItems((current) => [payload.data, ...current]);
    target.reset();
    setMessage("Pedoman ditambahkan.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <form onSubmit={add} className="space-y-3 rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Tambah Pedoman</h2>
        {["code", "title", "issuer", "year", "url"].map((name) => (
          <input
            key={name}
            name={name}
            required
            type={name === "year" ? "number" : name === "url" ? "url" : "text"}
            placeholder={name.toUpperCase()}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        ))}
        <textarea name="summary" required placeholder="Ringkasan pedoman" className="min-h-28 w-full rounded-md border px-3 py-2 text-sm" />
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Kriteria terkait</legend>
          {criteria.map((criterion) => (
            <label key={criterion.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="criterionIds" value={criterion.id} />
              {criterion.name}
            </label>
          ))}
        </fieldset>
        <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Tambah</button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border bg-card p-5">
            <p className="font-mono text-xs text-emerald-700">{item.code}</p>
            <h2 className="mt-1 font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.issuer}, {item.year}</p>
            <p className="mt-3 text-sm">{item.summary}</p>
            <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-sky-700 hover:underline">
              Buka sumber resmi
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
