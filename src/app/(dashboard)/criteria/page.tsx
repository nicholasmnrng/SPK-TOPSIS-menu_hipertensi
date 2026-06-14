import { CriteriaManager } from "@/components/criteria/criteria-manager";
import { PageHeader } from "@/components/shared/page-header";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { prisma } from "@/lib/db/prisma";

export default async function CriteriaPage() {
  await requirePageUser("criteria:manage");
  const criteria = await prisma.criterion.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
  });
  return (
    <>
      <PageHeader title="Master Kriteria" description="Atur bobot dan atribut lima komponen gizi. Seluruh kriteria digunakan dan total bobot wajib 100%." />
      <main className="p-6">
        <CriteriaManager initialCriteria={criteria.map((item) => ({ id: item.id, code: item.code, name: item.name, unit: item.unit, weight: item.weight, attribute: item.attribute }))} />
      </main>
    </>
  );
}
