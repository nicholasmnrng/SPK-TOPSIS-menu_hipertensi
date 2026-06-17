"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type RankingChartProps = {
  data: {
    alternativeName: string;
    preference: number;
  }[];
};

function shortenLabel(value: string, maxLength = 18) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function FoodNameTick(props: { x?: number; y?: number; payload?: { value: string } }) {
  const { x = 0, y = 0, payload } = props;
  const label = payload?.value ?? "";

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="end"
        transform="rotate(-25)"
        className="fill-muted-foreground text-[11px]"
      >
        {shortenLabel(label)}
      </text>
    </g>
  );
}

export function RankingChart({ data }: RankingChartProps) {
  return (
    <div className="h-[360px] rounded-lg border bg-card p-4">
      <div className="mb-4">
        <h2 className="font-semibold">Visualisasi Nilai Preferensi</h2>
        <p className="text-sm text-muted-foreground">Semakin tinggi Vi, semakin dekat dengan solusi ideal pada konfigurasi saat ini.</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data} margin={{ top: 8, right: 20, bottom: 54, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="alternativeName"
            height={64}
            interval={0}
            tick={<FoodNameTick />}
            tickLine={false}
            axisLine={{ stroke: "#d1d5db" }}
          />
          <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [Number(value).toFixed(6), "Vi"]}
            labelFormatter={(label) => String(label)}
          />
          <Bar dataKey="preference" fill="#059669" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
