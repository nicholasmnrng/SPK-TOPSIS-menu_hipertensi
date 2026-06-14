import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "audit:read");
    const data = await prisma.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error, "AUDIT_READ_FAILED");
  }
}
