import {
  TopsisAlternative,
  TopsisCalculationResult,
  TopsisCriterion,
  TopsisInput,
  TopsisMatrixRow,
  TopsisResultItem,
  TopsisValidationError,
} from "./types";

const NEUTRAL_PREFERENCE = 0.5;

export function calculateTopsis(input: TopsisInput): TopsisCalculationResult {
  validateTopsisInput(input);

  const criteria = cloneCriteria(input.criteria);
  const alternatives = cloneAlternatives(input.alternatives);
  const matrixSnapshot = buildDecisionMatrix(criteria, alternatives);
  const denominator = calculateDenominator(criteria, matrixSnapshot);
  const normalizedMatrix = normalizeMatrix(criteria, matrixSnapshot, denominator);
  const weightedMatrix = weightNormalizedMatrix(criteria, normalizedMatrix);
  const idealPositive = calculateIdealPositive(criteria, weightedMatrix);
  const idealNegative = calculateIdealNegative(criteria, weightedMatrix);
  const results = rankAlternatives(
    criteria,
    alternatives,
    normalizedMatrix,
    weightedMatrix,
    idealPositive,
    idealNegative,
  );

  return {
    criteriaSnapshot: criteria,
    matrixSnapshot,
    denominator,
    normalizedMatrix,
    weightedMatrix,
    idealPositive,
    idealNegative,
    results,
  };
}

export function roundTopsisResult(
  result: TopsisCalculationResult,
  fractionDigits = 4,
): TopsisCalculationResult {
  const round = (value: number) => Number(value.toFixed(fractionDigits));
  const roundRecord = (record: Record<string, number>) =>
    Object.fromEntries(Object.entries(record).map(([key, value]) => [key, round(value)]));
  const roundRows = (rows: TopsisMatrixRow[]) =>
    rows.map((row) => ({
      ...row,
      values: roundRecord(row.values),
    }));

  return {
    criteriaSnapshot: result.criteriaSnapshot.map((criterion) => ({
      ...criterion,
      weight: round(criterion.weight),
    })),
    matrixSnapshot: roundRows(result.matrixSnapshot),
    denominator: roundRecord(result.denominator),
    normalizedMatrix: roundRows(result.normalizedMatrix),
    weightedMatrix: roundRows(result.weightedMatrix),
    idealPositive: roundRecord(result.idealPositive),
    idealNegative: roundRecord(result.idealNegative),
    results: result.results.map((item) => ({
      ...item,
      dPositive: round(item.dPositive),
      dNegative: round(item.dNegative),
      preference: round(item.preference),
      scores: roundRecord(item.scores),
      normalized: roundRecord(item.normalized),
      weighted: roundRecord(item.weighted),
    })),
  };
}

function validateTopsisInput(input: TopsisInput): void {
  if (!input || !Array.isArray(input.criteria) || !Array.isArray(input.alternatives)) {
    throw new TopsisValidationError("Input TOPSIS harus memiliki criteria dan alternatives.");
  }

  if (input.criteria.length === 0) {
    throw new TopsisValidationError("Minimal harus ada satu kriteria aktif.");
  }

  if (input.alternatives.length === 0) {
    throw new TopsisValidationError("Minimal harus ada satu alternatif makanan aktif.");
  }

  const criterionIds = new Set<string>();
  for (const criterion of input.criteria) {
    if (!criterion.id || !criterion.code || !criterion.name) {
      throw new TopsisValidationError("Setiap kriteria harus memiliki id, code, dan name.");
    }

    if (criterionIds.has(criterion.id)) {
      throw new TopsisValidationError(`Kriteria duplikat ditemukan: ${criterion.id}.`);
    }

    if (!Number.isFinite(criterion.weight) || criterion.weight <= 0) {
      throw new TopsisValidationError(`Bobot kriteria ${criterion.name} harus lebih besar dari 0.`);
    }

    if (criterion.attribute !== "BENEFIT" && criterion.attribute !== "COST") {
      throw new TopsisValidationError(`Atribut kriteria ${criterion.name} tidak valid.`);
    }

    criterionIds.add(criterion.id);
  }

  const alternativeIds = new Set<string>();
  for (const alternative of input.alternatives) {
    if (!alternative.id || !alternative.name) {
      throw new TopsisValidationError("Setiap alternatif harus memiliki id dan name.");
    }

    if (alternativeIds.has(alternative.id)) {
      throw new TopsisValidationError(`Alternatif duplikat ditemukan: ${alternative.id}.`);
    }

    for (const criterion of input.criteria) {
      const score = alternative.scores[criterion.id];

      if (!Number.isFinite(score)) {
        throw new TopsisValidationError(
          `Nilai alternatif ${alternative.name} untuk kriteria ${criterion.name} wajib berupa angka.`,
        );
      }

      if (score < 0) {
        throw new TopsisValidationError(
          `Nilai alternatif ${alternative.name} untuk kriteria ${criterion.name} tidak boleh negatif.`,
        );
      }
    }

    alternativeIds.add(alternative.id);
  }
}

function cloneCriteria(criteria: TopsisCriterion[]): TopsisCriterion[] {
  return criteria.map((criterion) => ({ ...criterion }));
}

function cloneAlternatives(alternatives: TopsisAlternative[]): TopsisAlternative[] {
  return alternatives.map((alternative) => ({
    ...alternative,
    scores: { ...alternative.scores },
  }));
}

function buildDecisionMatrix(
  criteria: TopsisCriterion[],
  alternatives: TopsisAlternative[],
): TopsisMatrixRow[] {
  return alternatives.map((alternative) => ({
    alternativeId: alternative.id,
    alternativeName: alternative.name,
    values: Object.fromEntries(
      criteria.map((criterion) => [criterion.id, alternative.scores[criterion.id]]),
    ),
  }));
}

function calculateDenominator(
  criteria: TopsisCriterion[],
  matrix: TopsisMatrixRow[],
): Record<string, number> {
  return Object.fromEntries(
    criteria.map((criterion) => {
      const sumOfSquares = matrix.reduce((sum, row) => sum + row.values[criterion.id] ** 2, 0);
      const denominator = Math.sqrt(sumOfSquares);

      if (denominator === 0) {
        throw new TopsisValidationError(
          `Semua nilai untuk kriteria ${criterion.name} bernilai 0 sehingga tidak dapat dinormalisasi.`,
        );
      }

      return [criterion.id, denominator];
    }),
  );
}

function normalizeMatrix(
  criteria: TopsisCriterion[],
  matrix: TopsisMatrixRow[],
  denominator: Record<string, number>,
): TopsisMatrixRow[] {
  return matrix.map((row) => ({
    alternativeId: row.alternativeId,
    alternativeName: row.alternativeName,
    values: Object.fromEntries(
      criteria.map((criterion) => [
        criterion.id,
        row.values[criterion.id] / denominator[criterion.id],
      ]),
    ),
  }));
}

function weightNormalizedMatrix(
  criteria: TopsisCriterion[],
  normalizedMatrix: TopsisMatrixRow[],
): TopsisMatrixRow[] {
  return normalizedMatrix.map((row) => ({
    alternativeId: row.alternativeId,
    alternativeName: row.alternativeName,
    values: Object.fromEntries(
      criteria.map((criterion) => [
        criterion.id,
        row.values[criterion.id] * criterion.weight,
      ]),
    ),
  }));
}

function calculateIdealPositive(
  criteria: TopsisCriterion[],
  weightedMatrix: TopsisMatrixRow[],
): Record<string, number> {
  return Object.fromEntries(
    criteria.map((criterion) => {
      const values = weightedMatrix.map((row) => row.values[criterion.id]);
      const ideal =
        criterion.attribute === "BENEFIT" ? Math.max(...values) : Math.min(...values);

      return [criterion.id, ideal];
    }),
  );
}

function calculateIdealNegative(
  criteria: TopsisCriterion[],
  weightedMatrix: TopsisMatrixRow[],
): Record<string, number> {
  return Object.fromEntries(
    criteria.map((criterion) => {
      const values = weightedMatrix.map((row) => row.values[criterion.id]);
      const ideal =
        criterion.attribute === "BENEFIT" ? Math.min(...values) : Math.max(...values);

      return [criterion.id, ideal];
    }),
  );
}

function rankAlternatives(
  criteria: TopsisCriterion[],
  alternatives: TopsisAlternative[],
  normalizedMatrix: TopsisMatrixRow[],
  weightedMatrix: TopsisMatrixRow[],
  idealPositive: Record<string, number>,
  idealNegative: Record<string, number>,
): TopsisResultItem[] {
  const normalizedByAlternative = mapRowsByAlternative(normalizedMatrix);
  const weightedByAlternative = mapRowsByAlternative(weightedMatrix);

  const unranked = alternatives.map((alternative) => {
    const weighted = weightedByAlternative[alternative.id];
    const dPositive = euclideanDistance(criteria, weighted, idealPositive);
    const dNegative = euclideanDistance(criteria, weighted, idealNegative);
    const distanceTotal = dPositive + dNegative;
    const preference =
      distanceTotal === 0 ? NEUTRAL_PREFERENCE : dNegative / distanceTotal;

    return {
      alternativeId: alternative.id,
      alternativeName: alternative.name,
      rank: 0,
      dPositive,
      dNegative,
      preference,
      scores: { ...alternative.scores },
      normalized: { ...normalizedByAlternative[alternative.id] },
      weighted: { ...weighted },
    };
  });

  return unranked
    .sort((left, right) => {
      if (right.preference !== left.preference) {
        return right.preference - left.preference;
      }

      if (left.dPositive !== right.dPositive) {
        return left.dPositive - right.dPositive;
      }

      return left.alternativeName.localeCompare(right.alternativeName);
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

function mapRowsByAlternative(rows: TopsisMatrixRow[]): Record<string, Record<string, number>> {
  return Object.fromEntries(rows.map((row) => [row.alternativeId, row.values]));
}

function euclideanDistance(
  criteria: TopsisCriterion[],
  values: Record<string, number>,
  ideal: Record<string, number>,
): number {
  const sumOfSquares = criteria.reduce(
    (sum, criterion) => sum + (values[criterion.id] - ideal[criterion.id]) ** 2,
    0,
  );

  return Math.sqrt(sumOfSquares);
}
