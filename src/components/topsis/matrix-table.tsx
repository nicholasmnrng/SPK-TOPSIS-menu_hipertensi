import { TopsisCriterion, TopsisMatrixRow } from "@/lib/topsis";
import { formatNumber } from "@/lib/utils";

type MatrixTableProps = {
  title: string;
  criteria: TopsisCriterion[];
  rows: TopsisMatrixRow[];
};

export function MatrixTable({ title, criteria, rows }: MatrixTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Makanan</th>
              {criteria.map((criterion) => (
                <th key={criterion.id} className="px-4 py-3 font-medium">
                  {criterion.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.alternativeId} className="border-t">
                <td className="px-4 py-3 font-medium">{row.alternativeName}</td>
                {criteria.map((criterion) => (
                  <td key={criterion.id} className="px-4 py-3">
                    {formatNumber(row.values[criterion.id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
