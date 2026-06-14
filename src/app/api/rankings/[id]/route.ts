import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { getRanking } from "@/server/services/topsis-service";
import { apiError } from "@/lib/api/response";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "rankings:read");
    const { id } = await context.params;
    const data = await getRanking(id);
    if (!data) return NextResponse.json({ error: { message: "Ranking tidak ditemukan." } }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error, "RANKING_READ_FAILED");
  }
}
