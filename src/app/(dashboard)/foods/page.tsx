import { FoodManager } from "@/components/foods/food-manager";
import { PageHeader } from "@/components/shared/page-header";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { prisma } from "@/lib/db/prisma";

export default async function FoodsPage() {
  await requirePageUser("foods:manage");
  const [criteria, foods] = await Promise.all([
    prisma.criterion.findMany({
      where: { deletedAt: null },
      select: { id: true, code: true, name: true, unit: true },
      orderBy: { code: "asc" },
    }),
    prisma.food.findMany({
      where: { deletedAt: null },
      include: { nutrients: { include: { criterion: true } } },
      orderBy: { name: "asc" },
    }),
  ]);
  const initialFoods = foods.map((food) => {
    const nutrients = Object.fromEntries(food.nutrients.map((item) => [
      item.criterion.code,
      { value: item.value, name: item.criterion.name, unit: item.criterion.unit },
    ])) as Record<string, { value: number | null; name: string; unit: string }>;
    return {
      id: food.id,
      name: food.name,
      description: food.description,
      source: food.source,
      complete: criteria.every((criterion) => nutrients[criterion.code]?.value !== null && nutrients[criterion.code]?.value !== undefined),
      nutrients,
    };
  });
  return (
    <>
      <PageHeader title="Data Makanan" description="Data gizi desimal per 100 gram. Data belum lengkap tetap disimpan tetapi tidak masuk kalkulasi TOPSIS." />
      <main className="p-6">
        <FoodManager criteria={criteria} initialFoods={initialFoods} />
      </main>
    </>
  );
}
