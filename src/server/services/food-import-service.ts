import { FoodImportPreview, slugifyFoodName } from "@/lib/import/food-import";
import { prisma } from "@/lib/db/prisma";

export async function commitFoodImport(
  preview: FoodImportPreview,
  input: { fileName: string; fileType: string; userId: string },
) {
  if (preview.errorRows > 0) {
    throw new Error("Perbaiki semua baris error sebelum melakukan impor.");
  }

  const criteria = await prisma.criterion.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
  });
  if (criteria.length === 0) throw new Error("Master kriteria belum tersedia.");

  return prisma.$transaction(async (tx) => {
    for (const row of preview.rows) {
      const food = await tx.food.upsert({
        where: { normalizedName: row.normalizedName },
        update: {
          name: row.name,
          slug: slugifyFoodName(row.name),
          source: input.fileName,
          basisGram: 100,
          deletedAt: null,
        },
        create: {
          name: row.name,
          normalizedName: row.normalizedName,
          slug: slugifyFoodName(row.name),
          source: input.fileName,
          basisGram: 100,
        },
      });

      for (const criterion of criteria) {
        await tx.foodNutrient.upsert({
          where: {
            foodId_criterionId: {
              foodId: food.id,
              criterionId: criterion.id,
            },
          },
          update: { value: row.nutrients[criterion.code] },
          create: {
            foodId: food.id,
            criterionId: criterion.id,
            value: row.nutrients[criterion.code],
          },
        });
      }
    }

    return tx.importRun.create({
      data: {
        fileName: input.fileName,
        fileType: input.fileType,
        status: "SUCCESS",
        totalRows: preview.totalRows,
        validRows: preview.validRows,
        incompleteRows: preview.incompleteRows,
        errorRows: preview.errorRows,
        summary: {
          upsertMode: "normalized-name",
          basisGram: 100,
        },
        createdById: input.userId,
      },
    });
  });
}
