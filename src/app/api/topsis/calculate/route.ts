import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { calculateActiveDataRanking } from "@/server/services/topsis-service";
import { apiError } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "topsis:calculate");
    const response = await calculateActiveDataRanking(user.id);
    await writeAuditLog({
      actorId: user.id,
      action: "CALCULATE_TOPSIS",
      entityType: "ranking_run",
      entityId: response?.rankingRunId,
      metadata: { resultCount: response?.results.length ?? 0 },
      request,
    });
    return NextResponse.json({ status: "SUCCESS", ...response });
  } catch (error) {
    return apiError(error, "TOPSIS_CALCULATION_FAILED");
  }
}
