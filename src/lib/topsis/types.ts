export type CriterionAttribute = "BENEFIT" | "COST";

export type TopsisCriterion = {
  id: string;
  code: string;
  name: string;
  weight: number;
  attribute: CriterionAttribute;
};

export type TopsisAlternative = {
  id: string;
  name: string;
  scores: Record<string, number>;
};

export type TopsisInput = {
  criteria: TopsisCriterion[];
  alternatives: TopsisAlternative[];
};

export type TopsisMatrixRow = {
  alternativeId: string;
  alternativeName: string;
  values: Record<string, number>;
};

export type TopsisIdealSolution = Record<string, number>;

export type TopsisResultItem = {
  alternativeId: string;
  alternativeName: string;
  rank: number;
  dPositive: number;
  dNegative: number;
  preference: number;
  scores: Record<string, number>;
  normalized: Record<string, number>;
  weighted: Record<string, number>;
};

export type TopsisCalculationResult = {
  criteriaSnapshot: TopsisCriterion[];
  matrixSnapshot: TopsisMatrixRow[];
  denominator: Record<string, number>;
  normalizedMatrix: TopsisMatrixRow[];
  weightedMatrix: TopsisMatrixRow[];
  idealPositive: TopsisIdealSolution;
  idealNegative: TopsisIdealSolution;
  results: TopsisResultItem[];
};

export class TopsisValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TopsisValidationError";
  }
}
