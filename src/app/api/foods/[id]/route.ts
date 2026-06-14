import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";
import { foodSchema } from "@/lib/validations/food";
import {
  NUTRIENT_CODES,
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
    const payload = foodSchema.parse(await request.json());
    const criteria = await prisma.criterion.findMany({
      where: { deletedAt: null, code: { in: [...NUTRIENT_CODES] } },
    });
    const criteriaByCode = new Map(criteria.map((criterion) => [criterion.code, criterion.id]));

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
      for (const code of NUTRIENT_CODES) {
        const criterionId = criteriaByCode.get(code)!;
        await tx.foodNutrient.upsert({
          where: { foodId_criterionId: { foodId: id, criterionId } },
          update: { value: payload.nutrients[code] },
          create: { foodId: id, criterionId, value: payload.nutrients[code] },
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
