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

function serializeFood(food: {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  basisGram: number;
  nutrients: Array<{ value: number | null; criterion: { code: string; name: string; unit: string } }>;
}) {
  const nutrients = Object.fromEntries(
    food.nutrients.map((item) => [
      item.criterion.code,
      { value: item.value, name: item.criterion.name, unit: item.criterion.unit },
    ]),
  );
  return {
    ...food,
    nutrients,
    complete: NUTRIENT_CODES.every((code) => nutrients[code]?.value !== null && nutrients[code]?.value !== undefined),
  };
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "foods:manage");
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim();
    const foods = await prisma.food.findMany({
      where: {
        deletedAt: null,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      include: {
        nutrients: {
          include: { criterion: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: foods.map(serializeFood) });
  } catch (error) {
    return apiError(error, "FOODS_READ_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "foods:manage");
    const payload = foodSchema.parse(await request.json());
    const criteria = await prisma.criterion.findMany({
      where: { deletedAt: null, code: { in: [...NUTRIENT_CODES] } },
    });
    const criteriaByCode = new Map(criteria.map((criterion) => [criterion.code, criterion.id]));

    const food = await prisma.food.create({
      data: {
        name: payload.name,
        normalizedName: normalizeFoodName(payload.name),
        slug: slugifyFoodName(payload.name),
        description: payload.description,
        source: "manual",
        nutrients: {
          create: NUTRIENT_CODES.map((code) => ({
            criterionId: criteriaByCode.get(code)!,
            value: payload.nutrients[code],
          })),
        },
      },
      include: { nutrients: { include: { criterion: true } } },
    });

    await writeAuditLog({
      actorId: user.id,
      action: "CREATE",
      entityType: "food",
      entityId: food.id,
      metadata: { name: food.name },
      request,
    });
    return NextResponse.json({ data: serializeFood(food) }, { status: 201 });
  } catch (error) {
    return apiError(error, "FOOD_CREATE_FAILED");
  }
}
