import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { apiError } from "@/lib/api/response";
import { getMonitoringSnapshot } from "@/server/services/monitoring-service";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "monitoring:read");
    return NextResponse.json(await getMonitoringSnapshot());
  } catch (error) {
    return apiError(error, "MONITORING_READ_FAILED");
  }
}
