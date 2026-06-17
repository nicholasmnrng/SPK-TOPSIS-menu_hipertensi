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

type ActiveCriterion = {
  id: string;
  code: string;
  name: string;
  unit: string;
};

function serializeFood(food: {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  basisGram: number;
  nutrients: Array<{ value: number | null; criterion: { code: string; name: string; unit: string } }>;
}, criteria: ActiveCriterion[]) {
  const nutrients = Object.fromEntries(
    food.nutrients.map((item) => [
      item.criterion.code,
      { value: item.value, name: item.criterion.name, unit: item.criterion.unit },
    ]),
  );
  return {
    ...food,
    nutrients,
    complete: criteria.every((criterion) =>
      nutrients[criterion.code]?.value !== null && nutrients[criterion.code]?.value !== undefined,
    ),
  };
}

function getActiveCriteria() {
  return prisma.criterion.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, name: true, unit: true },
    orderBy: { code: "asc" },
  });
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "foods:manage");
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim();
    const [criteria, foods] = await Promise.all([
      getActiveCriteria(),
      prisma.food.findMany({
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
      }),
    ]);
    return NextResponse.json({ data: foods.map((food) => serializeFood(food, criteria)), criteria });
  } catch (error) {
    return apiError(error, "FOODS_READ_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "foods:manage");
    const criteria = await getActiveCriteria();
    if (criteria.length === 0) throw new Error("Master kriteria belum tersedia.");
    const payload = buildFoodSchema(criteria).parse(await request.json());
    const criteriaByCode = new Map(criteria.map((criterion) => [criterion.code, criterion.id]));

    const normalizedName = normalizeFoodName(payload.name);
    const slug = slugifyFoodName(payload.name);
    const existing = await prisma.food.findUnique({
      where: { normalizedName },
      include: { nutrients: { include: { criterion: true } } },
    });

    if (existing && !existing.deletedAt) {
      throw new Error("Nama makanan sudah ada. Gunakan tombol Edit pada data yang sudah tersedia.");
    }

    if (existing?.deletedAt) {
      const restored = await prisma.$transaction(async (tx) => {
        await tx.food.update({
          where: { id: existing.id },
          data: {
            name: payload.name,
            normalizedName,
            slug,
            description: payload.description,
            source: "manual",
            deletedAt: null,
          },
        });
        for (const criterion of criteria) {
          await tx.foodNutrient.upsert({
            where: { foodId_criterionId: { foodId: existing.id, criterionId: criterion.id } },
            update: { value: payload.nutrients[criterion.code] },
            create: { foodId: existing.id, criterionId: criterion.id, value: payload.nutrients[criterion.code] },
          });
        }
        return tx.food.findUniqueOrThrow({
          where: { id: existing.id },
          include: { nutrients: { include: { criterion: true } } },
        });
      });

      await writeAuditLog({
        actorId: user.id,
        action: "CREATE",
        entityType: "food",
        entityId: restored.id,
        metadata: { name: restored.name, restored: true },
        request,
      });
      return NextResponse.json({ data: serializeFood(restored, criteria) }, { status: 201 });
    }

    const food = await prisma.food.create({
      data: {
        name: payload.name,
        normalizedName,
        slug,
        description: payload.description,
        source: "manual",
        nutrients: {
          create: criteria.map((criterion) => ({
            criterionId: criteriaByCode.get(criterion.code)!,
            value: payload.nutrients[criterion.code],
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
    return NextResponse.json({ data: serializeFood(food, criteria) }, { status: 201 });
  } catch (error) {
    return apiError(error, "FOOD_CREATE_FAILED");
  }
}
