"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type RankingChartProps = {
  data: {
    alternativeName: string;
    preference: number;
  }[];
};

export function RankingChart({ data }: RankingChartProps) {
  return (
    <div className="h-80 rounded-lg border bg-card p-4">
      <div className="mb-4">
        <h2 className="font-semibold">Visualisasi Nilai Preferensi</h2>
        <p className="text-sm text-muted-foreground">Semakin tinggi Vi, semakin dekat dengan solusi ideal pada konfigurasi saat ini.</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="alternativeName" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="preference" fill="#059669" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
