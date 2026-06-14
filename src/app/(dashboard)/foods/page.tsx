import { FoodManager } from "@/components/foods/food-manager";
import { PageHeader } from "@/components/shared/page-header";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { prisma } from "@/lib/db/prisma";

const nutrientCodes = ["PROTEIN", "FAT", "CARBOHYDRATE", "FIBER", "SODIUM"] as const;

export default async function FoodsPage() {
  await requirePageUser("foods:manage");
  const foods = await prisma.food.findMany({
    where: { deletedAt: null },
    include: { nutrients: { include: { criterion: true } } },
    orderBy: { name: "asc" },
  });
  const initialFoods = foods.map((food) => {
    const nutrients = Object.fromEntries(food.nutrients.map((item) => [
      item.criterion.code,
      { value: item.value, name: item.criterion.name, unit: item.criterion.unit },
    ])) as Record<(typeof nutrientCodes)[number], { value: number | null; name: string; unit: string }>;
    return {
      id: food.id,
      name: food.name,
      description: food.description,
      source: food.source,
      complete: nutrientCodes.every((code) => nutrients[code]?.value !== null && nutrients[code]?.value !== undefined),
      nutrients,
    };
  });
  return (
    <>
      <PageHeader title="Data Makanan" description="Data gizi desimal per 100 gram. Data belum lengkap tetap disimpan tetapi tidak masuk kalkulasi TOPSIS." />
      <main className="p-6">
        <FoodManager initialFoods={initialFoods} />
      </main>
    </>
  );
}
