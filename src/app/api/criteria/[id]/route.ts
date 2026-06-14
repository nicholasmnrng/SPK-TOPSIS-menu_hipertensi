import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { criterionSchema } from "@/lib/validations/criteria";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "criteria:manage");
    const { id } = await context.params;
    const payload = criterionSchema.partial().parse(await request.json());
    const data = await prisma.criterion.update({ where: { id }, data: payload });
    await writeAuditLog({
      actorId: user.id,
      action: "UPDATE",
      entityType: "criterion",
      entityId: id,
      request,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error, "CRITERION_UPDATE_FAILED");
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "criteria:manage");
    const { id } = await context.params;
    const activeCount = await prisma.criterion.count({ where: { deletedAt: null } });
    if (activeCount <= 1) throw new Error("Minimal satu kriteria harus tersedia.");
    await prisma.criterion.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAuditLog({
      actorId: user.id,
      action: "DELETE",
      entityType: "criterion",
      entityId: id,
      request,
    });
    return NextResponse.json({ message: "Kriteria dihapus." });
  } catch (error) {
    return apiError(error, "CRITERION_DELETE_FAILED");
  }
}
