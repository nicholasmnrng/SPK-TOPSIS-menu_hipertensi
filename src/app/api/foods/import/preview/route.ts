import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { parseFoodFile } from "@/lib/import/food-import";
import { apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request.headers);
    assertPermission(user.role, "imports:manage");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("File wajib dipilih.");
    const preview = await parseFoodFile(file.name, Buffer.from(await file.arrayBuffer()));

    await prisma.importRun.create({
      data: {
        fileName: file.name,
        fileType: file.name.split(".").pop()?.toLowerCase() ?? "unknown",
        status: "PREVIEWED",
        totalRows: preview.totalRows,
        validRows: preview.validRows,
        incompleteRows: preview.incompleteRows,
        errorRows: preview.errorRows,
        summary: { preview: true },
        createdById: user.id,
      },
    });

    return NextResponse.json(preview);
  } catch (error) {
    return apiError(error, "IMPORT_PREVIEW_FAILED");
  }
}
