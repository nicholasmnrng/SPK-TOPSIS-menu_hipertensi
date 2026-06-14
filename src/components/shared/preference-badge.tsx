import { cn } from "@/lib/utils";

export function PreferenceBadge({ value }: { value: number }) {
  const label =
    value >= 0.65
      ? "Sangat Direkomendasikan"
      : value >= 0.45
        ? "Direkomendasikan Terbatas"
        : "Perlu Pertimbangan";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        value >= 0.65 && "bg-emerald-100 text-emerald-800",
        value >= 0.45 && value < 0.65 && "bg-sky-100 text-sky-800",
        value < 0.45 && "bg-amber-100 text-amber-800",
      )}
    >
      {label}
    </span>
  );
}
