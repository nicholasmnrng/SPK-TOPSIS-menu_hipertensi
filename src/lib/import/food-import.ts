import ExcelJS from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";
import { createHash } from "node:crypto";

export const NUTRIENT_CODES = ["PROTEIN", "FAT", "CARBOHYDRATE", "FIBER", "SODIUM"] as const;

export type NutrientCode = (typeof NUTRIENT_CODES)[number];

export type ImportedFoodRow = {
  rowNumber: number;
  name: string;
  normalizedName: string;
  nutrients: Record<NutrientCode, number | null>;
  errors: string[];
};

export type FoodImportPreview = {
  rows: ImportedFoodRow[];
  totalRows: number;
  validRows: number;
  incompleteRows: number;
  errorRows: number;
};

const HEADER_ALIASES: Record<NutrientCode | "NAME", string[]> = {
  NAME: ["nama bahan makanan", "nama makanan", "makanan", "name"],
  PROTEIN: ["protein"],
  FAT: ["lemak", "fat"],
  CARBOHYDRATE: ["karbohidrat", "carbohydrate", "carb"],
  FIBER: ["serat", "fiber"],
  SODIUM: ["natrium", "sodium", "garam"],
};

export function normalizeFoodName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
}

export function slugifyFoodName(value: string) {
  const normalized = normalizeFoodName(value);
  const base = normalized
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const hash = createHash("sha1").update(normalized).digest("hex").slice(0, 8);
  return `${base || "food"}-${hash}`;
}

export function parseDecimalInput(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;

  const text = String(value).trim();
  if (!text || text === "-") return null;

  const normalized = text.includes(",") && !text.includes(".")
    ? text.replace(",", ".")
    : text.replace(/\s/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
}

function matchHeader(value: unknown): NutrientCode | "NAME" | null {
  const normalized = normalizeHeader(value);
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => normalized === alias || normalized.startsWith(`${alias} `))) {
      return key as NutrientCode | "NAME";
    }
  }
  return null;
}

function buildPreview(rawRows: unknown[][]): FoodImportPreview {
  const headerIndex = rawRows.findIndex((row) => row.some((cell) => matchHeader(cell) === "NAME"));
  if (headerIndex < 0) {
    throw new Error("Header 'Nama Bahan Makanan' tidak ditemukan.");
  }

  const columnMap = new Map<NutrientCode | "NAME", number>();
  rawRows[headerIndex].forEach((cell, index) => {
    const matched = matchHeader(cell);
    if (matched && !columnMap.has(matched)) columnMap.set(matched, index);
  });

  const requiredHeaders: Array<NutrientCode | "NAME"> = ["NAME", ...NUTRIENT_CODES];
  const missingHeaders = requiredHeaders.filter((header) => !columnMap.has(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}.`);
  }

  const seenNames = new Set<string>();
  const rows: ImportedFoodRow[] = [];

  rawRows.slice(headerIndex + 1).forEach((rawRow, offset) => {
    const rowNumber = headerIndex + offset + 2;
    const name = String(rawRow[columnMap.get("NAME")!] ?? "").trim();
    if (!name) return;

    const normalizedName = normalizeFoodName(name);
    const errors: string[] = [];
    if (seenNames.has(normalizedName)) errors.push("Nama makanan duplikat di dalam file.");
    seenNames.add(normalizedName);

    const nutrients = Object.fromEntries(
      NUTRIENT_CODES.map((code) => {
        const rawValue = rawRow[columnMap.get(code)!];
        const parsed = parseDecimalInput(rawValue);
        const text = String(rawValue ?? "").trim();
        if (parsed === null && text && text !== "-") {
          errors.push(`${code}: nilai '${text}' bukan angka nonnegatif yang valid.`);
        }
        return [code, parsed];
      }),
    ) as Record<NutrientCode, number | null>;

    rows.push({ rowNumber, name, normalizedName, nutrients, errors });
  });

  return {
    rows,
    totalRows: rows.length,
    validRows: rows.filter((row) => row.errors.length === 0).length,
    incompleteRows: rows.filter(
      (row) => row.errors.length === 0 && Object.values(row.nutrients).some((value) => value === null),
    ).length,
    errorRows: rows.filter((row) => row.errors.length > 0).length,
  };
}

export function buildEditedFoodPreview(
  inputRows: Array<{
    rowNumber: number;
    name: string;
    nutrients: Record<NutrientCode, unknown>;
  }>,
): FoodImportPreview {
  const seenNames = new Set<string>();
  const rows = inputRows.map((input) => {
    const name = String(input.name ?? "").trim();
    const normalizedName = normalizeFoodName(name);
    const errors: string[] = [];
    if (!name) errors.push("Nama makanan wajib diisi.");
    if (seenNames.has(normalizedName)) errors.push("Nama makanan duplikat di dalam file.");
    seenNames.add(normalizedName);

    const nutrients = Object.fromEntries(
      NUTRIENT_CODES.map((code) => {
        const rawValue = input.nutrients?.[code];
        const parsed = parseDecimalInput(rawValue);
        const text = String(rawValue ?? "").trim();
        if (parsed === null && text && text !== "-") {
          errors.push(`${code}: nilai '${text}' bukan angka nonnegatif yang valid.`);
        }
        return [code, parsed];
      }),
    ) as Record<NutrientCode, number | null>;

    return {
      rowNumber: Number.isInteger(input.rowNumber) ? input.rowNumber : 0,
      name,
      normalizedName,
      nutrients,
      errors,
    };
  });

  return {
    rows,
    totalRows: rows.length,
    validRows: rows.filter((row) => row.errors.length === 0).length,
    incompleteRows: rows.filter(
      (row) => row.errors.length === 0 && Object.values(row.nutrients).some((value) => value === null),
    ).length,
    errorRows: rows.filter((row) => row.errors.length > 0).length,
  };
}

export async function parseFoodWorkbook(buffer: Buffer): Promise<FoodImportPreview> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const worksheet = workbook.getWorksheet("data clean") ?? workbook.worksheets[0];
  if (!worksheet) throw new Error("Workbook tidak memiliki worksheet.");

  const rows: unknown[][] = [];
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(values.map((cell: ExcelJS.CellValue) => {
      if (cell && typeof cell === "object" && "result" in cell) return cell.result;
      if (cell && typeof cell === "object" && "richText" in cell) {
        return cell.richText.map((part) => part.text).join("");
      }
      if (cell && typeof cell === "object" && "text" in cell) return cell.text;
      return cell;
    }));
  });

  return buildPreview(rows);
}

export function parseFoodCsv(text: string): FoodImportPreview {
  const records = parseCsv(text, {
    bom: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  }) as unknown[][];

  return buildPreview(records);
}

export async function parseFoodFile(fileName: string, buffer: Buffer) {
  const extension = fileName.toLocaleLowerCase("id-ID").split(".").pop();
  if (extension === "xlsx") return parseFoodWorkbook(buffer);
  if (extension === "csv") return parseFoodCsv(buffer.toString("utf8"));
  throw new Error("Format file harus .xlsx atau .csv.");
}
