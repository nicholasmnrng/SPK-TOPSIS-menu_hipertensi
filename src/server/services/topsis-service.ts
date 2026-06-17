import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { calculateTopsis, TopsisCalculationResult } from "@/lib/topsis";

export const RANKING_DISCLAIMER =
  "Peringkat TOPSIS menggunakan kandungan gizi per 100 gram dan konfigurasi bobot saat perhitungan. Hasil ini bukan diagnosis, tidak otomatis menunjukkan kepatuhan asupan harian, dan tidak menggantikan pertimbangan klinis tenaga kesehatan.";

type JustificationFactor = {
  criterionCode: string;
  criterionName: string;
  value: number;
  unit: string;
  median: number;
  direction: "strength" | "caution";
  distanceToIdealPositive: number;
  distanceToIdealNegative: number;
  idealContribution: number;
  message: string;
  guidelineCodes: string[];
};

export type RankingJustification = {
  summary: string;
  strengths: JustificationFactor[];
  cautions: JustificationFactor[];
  disclaimer: string;
};

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function formatValue(value: number, unit: string) {
  return `${Number(value.toFixed(3))} ${unit}`;
}

function buildJustification(
  result: TopsisCalculationResult["results"][number],
  criteria: Array<{
    id: string;
    code: string;
    name: string;
    unit: string;
    attribute: "BENEFIT" | "COST";
    guidelines: Array<{ guideline: { code: string } }>;
  }>,
  medians: Record<string, number>,
  idealPositive: Record<string, number>,
  idealNegative: Record<string, number>,
  rawScores: Record<string, number>,
): RankingJustification {
  const factors = criteria.map((criterion) => {
    const value = rawScores[criterion.id] ?? result.scores[criterion.id];
    const medianValue = medians[criterion.id];
    const favorable = criterion.attribute === "BENEFIT"
      ? value >= medianValue
      : value <= medianValue;
    const relativeDifference = medianValue === 0
      ? Math.abs(value)
      : Math.abs(value - medianValue) / Math.abs(medianValue);
    const direction: JustificationFactor["direction"] = favorable ? "strength" : "caution";
    const distanceToIdealPositive = Math.abs(result.weighted[criterion.id] - idealPositive[criterion.id]);
    const distanceToIdealNegative = Math.abs(result.weighted[criterion.id] - idealNegative[criterion.id]);
    const idealDistanceTotal = distanceToIdealPositive + distanceToIdealNegative;
    const idealContribution = idealDistanceTotal === 0
      ? 0.5
      : distanceToIdealNegative / idealDistanceTotal;
    const comparison = favorable
      ? criterion.attribute === "BENEFIT" ? "lebih tinggi" : "lebih rendah"
      : criterion.attribute === "BENEFIT" ? "lebih rendah" : "lebih tinggi";

    return {
      criterionCode: criterion.code,
      criterionName: criterion.name,
      value,
      unit: criterion.unit,
      median: medianValue,
      direction,
      impact: favorable ? idealContribution + relativeDifference : 1 - idealContribution + relativeDifference,
      distanceToIdealPositive,
      distanceToIdealNegative,
      idealContribution,
      message: `${criterion.name} ${formatValue(value, criterion.unit)}, ${comparison} dari median dataset ${formatValue(medianValue, criterion.unit)}; kedekatan lokal terhadap solusi ideal ${(idealContribution * 100).toFixed(1)}%.`,
      guidelineCodes: criterion.guidelines.map((item) => item.guideline.code),
    };
  });

  const strengths = factors
    .filter((factor) => factor.direction === "strength")
    .sort((left, right) => right.impact - left.impact)
    .slice(0, 3)
    .map(({ impact: _impact, ...factor }) => factor);
  const cautions = factors
    .filter((factor) => factor.direction === "caution")
    .sort((left, right) => right.impact - left.impact)
    .slice(0, 2)
    .map(({ impact: _impact, ...factor }) => factor);

  const strengthNames = strengths.map((factor) => factor.criterionName).join(", ");
  return {
    summary:
      `Peringkat #${result.rank} diperoleh dari kedekatan terhadap solusi ideal TOPSIS` +
      `${strengthNames ? `, terutama didukung oleh ${strengthNames}` : ""}.`,
    strengths,
    cautions,
    disclaimer: RANKING_DISCLAIMER,
  };
}

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

export async function calculateActiveDataRanking(userId: string) {
  const criteria = await prisma.criterion.findMany({
    where: { deletedAt: null },
    include: {
      guidelines: {
        include: { guideline: true },
      },
    },
    orderBy: { code: "asc" },
  });
  if (criteria.length === 0) throw new Error("Master kriteria belum tersedia.");

  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.000001) {
    throw new Error(`Total bobot kriteria harus 100%, saat ini ${(totalWeight * 100).toFixed(2)}%.`);
  }

  const foods = await prisma.food.findMany({
    where: { deletedAt: null },
    include: { nutrients: true },
    orderBy: { name: "asc" },
  });

  const completeFoods = foods.filter((food) =>
    criteria.every((criterion) =>
      food.nutrients.some(
        (nutrient) => nutrient.criterionId === criterion.id && nutrient.value !== null,
      ),
    ),
  );
  if (completeFoods.length === 0) {
    throw new Error("Tidak ada makanan dengan data gizi lengkap.");
  }

  const calculationCriteria = criteria.map((criterion) => ({
    id: criterion.id,
    code: criterion.code,
    name: criterion.name,
    weight: criterion.weight,
    attribute: criterion.attribute,
  }));
  const rawScoresByFoodId = new Map(
    completeFoods.map((food) => [
      food.id,
      Object.fromEntries(
        criteria.map((criterion) => [
          criterion.id,
          food.nutrients.find((nutrient) => nutrient.criterionId === criterion.id)!.value!,
        ]),
      ) as Record<string, number>,
    ]),
  );

  const input = {
    criteria: calculationCriteria,
    alternatives: completeFoods.map((food) => ({
      id: food.id,
      name: food.name,
      scores: Object.fromEntries(
        criteria.map((criterion) => [
          criterion.id,
          food.nutrients.find((nutrient) => nutrient.criterionId === criterion.id)!.value!,
        ]),
      ),
    })),
  };

  const calculation = calculateTopsis(input);
  const medians = Object.fromEntries(
    criteria.map((criterion) => [
      criterion.id,
      median(completeFoods.map((food) => rawScoresByFoodId.get(food.id)![criterion.id])),
    ]),
  );
  const guidelineSnapshot = Array.from(
    new Map(
      criteria.flatMap((criterion) =>
        criterion.guidelines.map((item) => [item.guideline.id, item.guideline]),
      ),
    ).values(),
  ).map((guideline) => ({
    code: guideline.code,
    title: guideline.title,
    issuer: guideline.issuer,
    year: guideline.year,
    url: guideline.url,
    summary: guideline.summary,
  }));

  const run = await prisma.$transaction(async (tx) => {
    const created = await tx.rankingRun.create({
      data: {
        status: "SUCCESS",
        criteriaSnapshot: asJson(
          criteria.map((criterion) => ({
            id: criterion.id,
            code: criterion.code,
            name: criterion.name,
            unit: criterion.unit,
            weight: criterion.weight,
            attribute: criterion.attribute,
          })),
        ),
        guidelineSnapshot: asJson(guidelineSnapshot),
        matrixSnapshot: asJson(calculation.matrixSnapshot),
        normalizedMatrix: asJson(calculation.normalizedMatrix),
        weightedMatrix: asJson(calculation.weightedMatrix),
        idealPositive: asJson(calculation.idealPositive),
        idealNegative: asJson(calculation.idealNegative),
        disclaimer: RANKING_DISCLAIMER,
        createdById: userId,
      },
    });

    await tx.rankingResult.createMany({
      data: calculation.results.map((result) => ({
        rankingRunId: created.id,
        foodId: result.alternativeId,
        rank: result.rank,
        dPositive: result.dPositive,
        dNegative: result.dNegative,
        preference: result.preference,
        detail: asJson({
          scores: result.scores,
          rawNutrients: rawScoresByFoodId.get(result.alternativeId),
          normalized: result.normalized,
          weighted: result.weighted,
          medians,
        }),
          justification: asJson(
            buildJustification(
              result,
              criteria,
              medians,
              calculation.idealPositive,
              calculation.idealNegative,
              rawScoresByFoodId.get(result.alternativeId) ?? result.scores,
            ),
          ),
      })),
    });

    return created;
  });

  return getRanking(run.id);
}

export async function getRanking(id?: string) {
  const run = id
    ? await prisma.rankingRun.findUnique({
        where: { id },
        include: {
          results: {
            include: { food: true },
            orderBy: { rank: "asc" },
          },
        },
      })
    : await prisma.rankingRun.findFirst({
        where: { status: "SUCCESS" },
        include: {
          results: {
            include: { food: true },
            orderBy: { rank: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

  if (!run) return null;
  return {
    rankingRunId: run.id,
    createdAt: run.createdAt.toISOString(),
    status: run.status,
    criteriaSnapshot: run.criteriaSnapshot,
    guidelineSnapshot: run.guidelineSnapshot,
    matrixSnapshot: run.matrixSnapshot,
    normalizedMatrix: run.normalizedMatrix,
    weightedMatrix: run.weightedMatrix,
    idealPositive: run.idealPositive,
    idealNegative: run.idealNegative,
    disclaimer: run.disclaimer,
    results: run.results.map((result) => ({
      rank: result.rank,
      foodId: result.foodId,
      foodName: result.food.name,
      dPositive: result.dPositive,
      dNegative: result.dNegative,
      preference: result.preference,
      detail: result.detail,
      justification: result.justification,
    })),
  };
}

export async function getRankingHistory() {
  return prisma.rankingRun.findMany({
    where: { status: "SUCCESS" },
    select: {
      id: true,
      createdAt: true,
      _count: { select: { results: true } },
      results: {
        take: 1,
        orderBy: { rank: "asc" },
        select: { preference: true, food: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}
