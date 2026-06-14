const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  const counts = {
    roles: await prisma.role.count(),
    criteria: await prisma.criterion.count(),
    alternatives: await prisma.alternative.count(),
    assessments: await prisma.assessment.count(),
    migrations: await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS count FROM "_prisma_migrations"'),
  };

  console.log(JSON.stringify({ tables, counts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.code || error.name, error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
