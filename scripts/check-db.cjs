const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  const counts = {
    users: await prisma.user.count(),
    criteria: await prisma.criterion.count(),
    foods: await prisma.food.count(),
    foodNutrients: await prisma.foodNutrient.count(),
    importRuns: await prisma.importRun.count(),
    rankingRuns: await prisma.rankingRun.count(),
    migrations: await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS count FROM "_prisma_migrations"'),
  };
  const criteria = await prisma.criterion.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: { code: true, name: true, unit: true, weight: true, attribute: true },
  });
  const nutrientHealth = {
    negativeValues: await prisma.foodNutrient.count({
      where: { value: { lt: 0 } },
    }),
    incompleteValues: await prisma.foodNutrient.count({
      where: { value: null },
    }),
  };

  console.log(JSON.stringify({ tables, counts, criteria, nutrientHealth }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.code || error.name, error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
