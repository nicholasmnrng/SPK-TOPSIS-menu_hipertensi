import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { getCurrentUser } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("APPROVE"), userId: z.string().min(1) }),
  z.object({ action: z.literal("SUSPEND"), userId: z.string().min(1), reason: z.string().trim().max(500).optional() }),
  z.object({ action: z.literal("ACTIVATE"), userId: z.string().min(1) }),
  z.object({ action: z.literal("REVOKE_SESSIONS"), userId: z.string().min(1) }),
  z.object({ action: z.literal("RESET_PASSWORD"), userId: z.string().min(1), password: z.string().min(8).max(128) }),
]);

export async function GET(request: Request) {
  try {
    const current = await getCurrentUser(request.headers);
    assertPermission(current.role, "users:manage");
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        banned: true,
        banReason: true,
        approvedAt: true,
        createdAt: true,
        _count: { select: { sessions: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ data: users });
  } catch (error) {
    return apiError(error, "ACCOUNT_READ_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser(request.headers);
    assertPermission(current.role, "users:manage");
    const payload = actionSchema.parse(await request.json());
    const target = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
    if (target.role === "ADMIN" && target.id !== current.id) {
      throw new Error("Akun Admin lain tidak dapat diubah dari panel ini.");
    }

    let auditAction:
      | "APPROVE_ACCOUNT"
      | "SUSPEND_ACCOUNT"
      | "ACTIVATE_ACCOUNT"
      | "RESET_PASSWORD"
      | "REVOKE_SESSIONS";

    switch (payload.action) {
      case "APPROVE":
        await prisma.user.update({
          where: { id: payload.userId },
          data: { status: "ACTIVE", approvedAt: new Date(), banned: false, banReason: null },
        });
        auditAction = "APPROVE_ACCOUNT";
        break;
      case "SUSPEND":
        await prisma.$transaction([
          prisma.user.update({
            where: { id: payload.userId },
            data: {
              status: "SUSPENDED",
              banned: true,
              banReason: payload.reason ?? "Ditangguhkan oleh Admin",
            },
          }),
          prisma.session.deleteMany({ where: { userId: payload.userId } }),
        ]);
        auditAction = "SUSPEND_ACCOUNT";
        break;
      case "ACTIVATE":
        await prisma.user.update({
          where: { id: payload.userId },
          data: { status: "ACTIVE", approvedAt: target.approvedAt ?? new Date(), banned: false, banReason: null, banExpires: null },
        });
        auditAction = "ACTIVATE_ACCOUNT";
        break;
      case "REVOKE_SESSIONS":
        await prisma.session.deleteMany({ where: { userId: payload.userId } });
        auditAction = "REVOKE_SESSIONS";
        break;
      case "RESET_PASSWORD": {
        const password = await hashPassword(payload.password);
        await prisma.account.updateMany({
          where: { userId: payload.userId, providerId: "credential" },
          data: { password },
        });
        await prisma.session.deleteMany({ where: { userId: payload.userId } });
        auditAction = "RESET_PASSWORD";
        break;
      }
    }

    await writeAuditLog({
      actorId: current.id,
      action: auditAction,
      entityType: "user",
      entityId: payload.userId,
      metadata: { targetEmail: target.email },
      request,
    });
    return NextResponse.json({ message: "Aksi akun berhasil." });
  } catch (error) {
    return apiError(error, "ACCOUNT_ACTION_FAILED");
  }
}
