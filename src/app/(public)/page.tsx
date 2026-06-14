import Link from "next/link";
import { Activity, ArrowRight, Calculator, FileSpreadsheet, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Sistem pendukung keputusan untuk ahli gizi
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold md:text-6xl">
            SPK TOPSIS Makanan untuk Hipertensi
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Kelola data gizi per 100 gram, hitung peringkat TOPSIS secara transparan,
            dan hasilkan laporan dengan justifikasi berbasis pedoman resmi.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
              Masuk <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/register" className="inline-flex items-center rounded-md border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted">
              Daftar sebagai Ahli Gizi
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          {[
            [FileSpreadsheet, "Impor Excel dan CSV", "Preview dan validasi data desimal sebelum disimpan."],
            [Calculator, "TOPSIS transparan", "Matriks, solusi ideal, nilai preferensi, dan snapshot tersimpan."],
            [Activity, "Justifikasi kontekstual", "Kekuatan, kehati-hatian, sumber pedoman, dan disclaimer klinis."],
          ].map(([Icon, title, description]) => {
            const FeatureIcon = Icon as typeof Activity;
            return (
              <article key={String(title)} className="rounded-lg border bg-card p-5 shadow-sm">
                <FeatureIcon className="h-6 w-6 text-emerald-600" />
                <h2 className="mt-3 font-semibold">{String(title)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{String(description)}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
