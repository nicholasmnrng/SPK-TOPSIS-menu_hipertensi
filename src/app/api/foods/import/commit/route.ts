import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { buildEditedFoodPreview, NUTRIENT_CODES, parseFoodFile } from "@/lib/import/food-import";
import { apiError } from "@/lib/api/response";
import { commitFoodImport } from "@/server/services/food-import-service";
import { writeAuditLog } from "@/lib/audit/audit";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "imports:manage");
    let fileName: string;
    let fileType: string;
    let preview;
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json();
      fileName = String(body.fileName ?? "import");
      fileType = String(body.fileType ?? fileName.split(".").pop() ?? "unknown").toLowerCase();
      if (!Array.isArray(body.rows)) throw new Error("Baris preview wajib tersedia.");
      preview = buildEditedFoodPreview(body.rows.map((row: Record<string, unknown>) => ({
        rowNumber: Number(row.rowNumber),
        name: String(row.name ?? ""),
        nutrients: Object.fromEntries(
          NUTRIENT_CODES.map((code) => [code, (row.nutrients as Record<string, unknown> | undefined)?.[code]]),
        ) as Record<(typeof NUTRIENT_CODES)[number], unknown>,
      })));
    } else {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new Error("File wajib dipilih.");
      fileName = file.name;
      fileType = file.name.split(".").pop()?.toLowerCase() ?? "unknown";
      preview = await parseFoodFile(file.name, Buffer.from(await file.arrayBuffer()));
    }
    const run = await commitFoodImport(preview, {
      fileName,
      fileType,
      userId: user.id,
    });
    await writeAuditLog({
      actorId: user.id,
      action: "IMPORT_DATA",
      entityType: "import_run",
      entityId: run.id,
      metadata: {
        fileName,
        totalRows: preview.totalRows,
        incompleteRows: preview.incompleteRows,
      },
      request,
    });
    return NextResponse.json({ data: run });
  } catch (error) {
    return apiError(error, "IMPORT_COMMIT_FAILED");
  }
}
