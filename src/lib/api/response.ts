import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthorizationError } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/db/prisma";

export async function apiError(error: unknown, fallbackCode = "REQUEST_FAILED") {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: { code: error.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", message: error.message } },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Data tidak valid.",
          fields: error.flatten().fieldErrors,
        },
      },
      { status: 422 },
    );
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: "SYSTEM_ERROR",
        entityType: "api",
        metadata: {
          code: fallbackCode,
          message: error instanceof Error ? error.message : "Permintaan gagal diproses.",
        },
      },
    });
  } catch {
    // Preserve the original API error when the audit database write also fails.
  }

  return NextResponse.json(
    {
      error: {
        code: fallbackCode,
        message: error instanceof Error ? error.message : "Permintaan gagal diproses.",
      },
    },
    { status: 400 },
  );
}
