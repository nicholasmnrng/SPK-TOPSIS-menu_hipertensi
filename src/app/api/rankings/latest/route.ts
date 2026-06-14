import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { getRanking } from "@/server/services/topsis-service";
import { apiError } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "rankings:read");
    return NextResponse.json({ data: await getRanking() });
  } catch (error) {
    return apiError(error, "RANKING_READ_FAILED");
  }
}
