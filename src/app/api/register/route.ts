import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/audit";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const result = await auth.api.signUpEmail({
      body,
      headers: request.headers,
    });

    const user = await prisma.user.update({
      where: { id: result.user.id },
      data: {
        role: "USER",
        status: "PENDING",
        approvedAt: null,
      },
    });

    await writeAuditLog({
      actorId: user.id,
      action: "REGISTER",
      entityType: "user",
      entityId: user.id,
      metadata: { email: user.email },
      request,
    });

    return NextResponse.json({ id: user.id, status: user.status }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "REGISTRATION_FAILED",
          message: error instanceof Error ? error.message : "Registrasi gagal.",
        },
      },
      { status: 400 },
    );
  }
}
