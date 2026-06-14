import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPK Menu Hipertensi",
  description: "Sistem Pendukung Keputusan pemilihan menu makanan sehat menggunakan TOPSIS.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
