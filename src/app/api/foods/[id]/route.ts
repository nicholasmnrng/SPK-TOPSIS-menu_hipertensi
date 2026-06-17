import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";
import { buildFoodSchema } from "@/lib/validations/food";
import {
  normalizeFoodName,
  slugifyFoodName,
} from "@/lib/import/food-import";
import { writeAuditLog } from "@/lib/audit/audit";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "foods:manage");
    const { id } = await context.params;
    const criteria = await prisma.criterion.findMany({
      where: { deletedAt: null },
      select: { id: true, code: true },
      orderBy: { code: "asc" },
    });
    if (criteria.length === 0) throw new Error("Master kriteria belum tersedia.");
    const payload = buildFoodSchema(criteria).parse(await request.json());

    const food = await prisma.$transaction(async (tx) => {
      await tx.food.update({
        where: { id },
        data: {
          name: payload.name,
          normalizedName: normalizeFoodName(payload.name),
          slug: slugifyFoodName(payload.name),
          description: payload.description,
        },
      });
      for (const criterion of criteria) {
        await tx.foodNutrient.upsert({
          where: { foodId_criterionId: { foodId: id, criterionId: criterion.id } },
          update: { value: payload.nutrients[criterion.code] },
          create: { foodId: id, criterionId: criterion.id, value: payload.nutrients[criterion.code] },
        });
      }
      return tx.food.findUniqueOrThrow({
        where: { id },
        include: { nutrients: { include: { criterion: true } } },
      });
    });

    await writeAuditLog({
      actorId: user.id,
      action: "UPDATE",
      entityType: "food",
      entityId: id,
      request,
    });
    return NextResponse.json({ data: food });
  } catch (error) {
    return apiError(error, "FOOD_UPDATE_FAILED");
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "foods:manage");
    const { id } = await context.params;
    await prisma.food.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAuditLog({
      actorId: user.id,
      action: "DELETE",
      entityType: "food",
      entityId: id,
      request,
    });
    return NextResponse.json({ message: "Data makanan dihapus." });
  } catch (error) {
    return apiError(error, "FOOD_DELETE_FAILED");
  }
}
