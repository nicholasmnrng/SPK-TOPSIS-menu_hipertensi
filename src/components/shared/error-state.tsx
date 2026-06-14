type ErrorStateProps = {
  title?: string;
  description?: string;
};

export function ErrorState({
  title = "Data gagal dimuat",
  description = "Coba muat ulang halaman atau periksa koneksi aplikasi.",
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-950">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-rose-700">{description}</p>
    </div>
  );
}
