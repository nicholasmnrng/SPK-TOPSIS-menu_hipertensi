import { GuidelineManager } from "@/components/guidelines/guideline-manager";
import { PageHeader } from "@/components/shared/page-header";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { prisma } from "@/lib/db/prisma";

export default async function GuidelinesPage() {
  await requirePageUser("guidelines:manage");
  const [guidelines, criteria] = await Promise.all([
    prisma.guideline.findMany({
      where: { deletedAt: null },
      orderBy: [{ year: "desc" }, { code: "asc" }],
    }),
    prisma.criterion.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { code: "asc" },
    }),
  ]);
  return (
    <>
      <PageHeader title="Master Pedoman" description="Sumber regulasi yang dipakai untuk konteks justifikasi peringkat." />
      <main className="p-6">
        <GuidelineManager initialGuidelines={guidelines} criteria={criteria} />
      </main>
    </>
  );
}
