import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { getRanking } from "@/server/services/topsis-service";
import { buildRankingPdf } from "@/lib/export/report";
import { apiError } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "reports:export");
    const id = new URL(request.url).searchParams.get("rankingRunId") ?? undefined;
    const ranking = await getRanking(id);
    if (!ranking) throw new Error("Ranking belum tersedia.");
    const pdf = await buildRankingPdf(ranking);
    await writeAuditLog({
      actorId: user.id,
      action: "EXPORT_REPORT",
      entityType: "ranking_run",
      entityId: ranking.rankingRunId,
      metadata: { format: "pdf", bytes: pdf.length },
      request,
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ranking-topsis-${ranking.rankingRunId}.pdf"`,
        "Content-Length": String(pdf.length),
      },
    });
  } catch (error) {
    return apiError(error, "PDF_EXPORT_FAILED");
  }
}
