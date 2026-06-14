import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { guidelineSchema } from "@/lib/validations/guideline";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "guidelines:manage");
    const { id } = await context.params;
    const payload = guidelineSchema.parse(await request.json());
    const data = await prisma.$transaction(async (tx) => {
      await tx.criterionGuideline.deleteMany({ where: { guidelineId: id } });
      return tx.guideline.update({
        where: { id },
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
    });
    await writeAuditLog({
      actorId: user.id,
      action: "UPDATE",
      entityType: "guideline",
      entityId: id,
      request,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error, "GUIDELINE_UPDATE_FAILED");
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "guidelines:manage");
    const { id } = await context.params;
    await prisma.guideline.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAuditLog({
      actorId: user.id,
      action: "DELETE",
      entityType: "guideline",
      entityId: id,
      request,
    });
    return NextResponse.json({ message: "Pedoman dihapus." });
  } catch (error) {
    return apiError(error, "GUIDELINE_DELETE_FAILED");
  }
}
