import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import {
  NUTRIENT_CODES,
  parseFoodWorkbook,
  slugifyFoodName,
} from "../src/lib/import/food-import";

const prisma = new PrismaClient();

const criteria = [
  {
    id: "criterion-protein",
    code: "PROTEIN",
    name: "Protein",
    unit: "g",
    weight: 0.2,
    attribute: "BENEFIT" as const,
    description: "Kandungan protein per 100 gram bahan makanan.",
  },
  {
    id: "criterion-fat",
    code: "FAT",
    name: "Lemak",
    unit: "g",
    weight: 0.15,
    attribute: "COST" as const,
    description: "Kandungan lemak per 100 gram bahan makanan.",
  },
  {
    id: "criterion-carbohydrate",
    code: "CARBOHYDRATE",
    name: "Karbohidrat",
    unit: "g",
    weight: 0.1,
    attribute: "BENEFIT" as const,
    description: "Kandungan karbohidrat per 100 gram bahan makanan.",
  },
  {
    id: "criterion-fiber",
    code: "FIBER",
    name: "Serat",
    unit: "g",
    weight: 0.25,
    attribute: "BENEFIT" as const,
    description: "Kandungan serat per 100 gram bahan makanan.",
  },
  {
    id: "criterion-sodium",
    code: "SODIUM",
    name: "Natrium",
    unit: "mg",
    weight: 0.3,
    attribute: "COST" as const,
    description: "Kandungan natrium per 100 gram bahan makanan.",
  },
];

const guidelines = [
  {
    id: "guideline-kmk-4634-2021",
    code: "KMK-HK.01.07-MENKES-4634-2021",
    title: "Pedoman Nasional Pelayanan Kedokteran Tata Laksana Hipertensi Dewasa",
    issuer: "Kementerian Kesehatan Republik Indonesia",
    year: 2021,
    url: "https://kemkes.go.id/app_asset/file_content_download/1700108499655598d3c61e16.60954826.pdf",
    summary:
      "Menganjurkan pembatasan natrium, pola makan DASH, konsumsi sayur, buah, kacang, ikan, serta pembatasan lemak jenuh.",
  },
  {
    id: "guideline-permenkes-28-2019",
    code: "PERMENKES-28-2019",
    title: "Angka Kecukupan Gizi yang Dianjurkan untuk Masyarakat Indonesia",
    issuer: "Kementerian Kesehatan Republik Indonesia",
    year: 2019,
    url: "https://keslan.kemkes.go.id/unduhan/fileunduhan_1658478676_551368.pdf",
    summary:
      "Menetapkan acuan kecukupan energi, protein, lemak, karbohidrat, serat, air, vitamin, dan mineral untuk masyarakat Indonesia.",
  },
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@spk.local";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const name = process.env.ADMIN_NAME ?? "Administrator";
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "ADMIN",
      status: "ACTIVE",
      approvedAt: new Date(),
      banned: false,
      deletedAt: null,
    },
    create: {
      name,
      email,
      emailVerified: true,
      role: "ADMIN",
      status: "ACTIVE",
      approvedAt: new Date(),
    },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: user.id,
      },
    },
    update: { password: passwordHash },
    create: {
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: passwordHash,
    },
  });
}

async function main() {
  await seedAdmin();

  for (const criterion of criteria) {
    await prisma.criterion.upsert({
      where: { code: criterion.code },
      update: { ...criterion, deletedAt: null },
      create: criterion,
    });
  }

  for (const guideline of guidelines) {
    await prisma.guideline.upsert({
      where: { code: guideline.code },
      update: { ...guideline, deletedAt: null },
      create: guideline,
    });
  }

  const kmk = guidelines[0];
  const akg = guidelines[1];
  for (const criterion of criteria) {
    const guidelineIds = criterion.code === "SODIUM" || criterion.code === "FAT"
      ? [kmk.id, akg.id]
      : [akg.id, kmk.id];

    for (const guidelineId of guidelineIds) {
      await prisma.criterionGuideline.upsert({
        where: {
          criterionId_guidelineId: {
            criterionId: criterion.id,
            guidelineId,
          },
        },
        update: {},
        create: {
          criterionId: criterion.id,
          guidelineId,
        },
      });
    }
  }

  const workbookPath = path.join(process.cwd(), "docs", "spk_topsis_k.xlsx");
  const preview = await parseFoodWorkbook(await fs.readFile(workbookPath));
  if (preview.errorRows > 0) {
    throw new Error(`Seed workbook memiliki ${preview.errorRows} baris tidak valid.`);
  }

  const criteriaByCode = new Map(criteria.map((criterion) => [criterion.code, criterion]));
  for (const row of preview.rows) {
    const food = await prisma.food.upsert({
      where: { normalizedName: row.normalizedName },
      update: {
        name: row.name,
        slug: slugifyFoodName(row.name),
        source: "docs/spk_topsis_k.xlsx",
        basisGram: 100,
        deletedAt: null,
      },
      create: {
        name: row.name,
        normalizedName: row.normalizedName,
        slug: slugifyFoodName(row.name),
        source: "docs/spk_topsis_k.xlsx",
        basisGram: 100,
      },
    });

    for (const code of NUTRIENT_CODES) {
      const criterion = criteriaByCode.get(code)!;
      await prisma.foodNutrient.upsert({
        where: {
          foodId_criterionId: {
            foodId: food.id,
            criterionId: criterion.id,
          },
        },
        update: { value: row.nutrients[code] },
        create: {
          foodId: food.id,
          criterionId: criterion.id,
          value: row.nutrients[code],
        },
      });
    }
  }

  await prisma.importRun.create({
    data: {
      fileName: "spk_topsis_k.xlsx",
      fileType: "xlsx",
      status: "SUCCESS",
      totalRows: preview.totalRows,
      validRows: preview.validRows,
      incompleteRows: preview.incompleteRows,
      errorRows: preview.errorRows,
      summary: { source: "seed" },
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
