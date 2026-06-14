import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { guidelineSchema } from "@/lib/validations/guideline";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "guidelines:manage");
    const data = await prisma.guideline.findMany({
      where: { deletedAt: null },
      include: { criteria: { include: { criterion: true } } },
      orderBy: [{ year: "desc" }, { code: "asc" }],
    });
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error, "GUIDELINE_READ_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "guidelines:manage");
    const payload = guidelineSchema.parse(await request.json());
    const data = await prisma.guideline.create({
      data: {
        code: payload.code,
        title: payload.title,
        issuer: payload.issuer,
        year: payload.year,
        url: payload.url,
        summary: payload.summary,
        criteria: {
          create: payload.criterionIds.map((criterionId) => ({ criterionId })),
        },
      },
    });
    await writeAuditLog({
      actorId: user.id,
      action: "CREATE",
      entityType: "guideline",
      entityId: data.id,
      request,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error, "GUIDELINE_CREATE_FAILED");
  }
}
