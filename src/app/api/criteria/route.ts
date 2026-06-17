import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { criterionSchema, criteriaWeightSchema } from "@/lib/validations/criteria";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit";

const MAX_ACTIVE_CRITERIA = 10;

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "criteria:manage");
    const data = await prisma.criterion.findMany({
      where: { deletedAt: null },
      include: {
        guidelines: {
          include: { guideline: true },
        },
      },
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error, "CRITERIA_READ_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "criteria:manage");
    const activeCount = await prisma.criterion.count({ where: { deletedAt: null } });
    if (activeCount >= MAX_ACTIVE_CRITERIA) {
      throw new Error(`Maksimal ${MAX_ACTIVE_CRITERIA} kriteria aktif.`);
    }
    const payload = criterionSchema.parse(await request.json());
    const data = await prisma.criterion.create({ data: payload });
    await writeAuditLog({
      actorId: user.id,
      action: "CREATE",
      entityType: "criterion",
      entityId: data.id,
      metadata: { code: data.code },
      request,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error, "CRITERION_CREATE_FAILED");
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "criteria:manage");
    const payload = criteriaWeightSchema.parse(await request.json());
    await prisma.$transaction(
      payload.items.map((item) =>
        prisma.criterion.update({
          where: { id: item.id },
          data: { weight: item.weight, attribute: item.attribute },
        }),
      ),
    );
    await writeAuditLog({
      actorId: user.id,
      action: "UPDATE",
      entityType: "criteria_weights",
      metadata: { count: payload.items.length },
      request,
    });
    return NextResponse.json({ message: "Konfigurasi kriteria tersimpan." });
  } catch (error) {
    return apiError(error, "CRITERIA_UPDATE_FAILED");
  }
}
