import { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
};

export function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        {icon ? <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">{icon}</div> : null}
      </div>
      {description ? <p className="mt-3 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
