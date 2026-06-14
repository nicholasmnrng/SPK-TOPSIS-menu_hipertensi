import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type AuditInput = {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  request?: Request;
};

export async function writeAuditLog(input: AuditInput) {
  const forwardedFor = input.request?.headers.get("x-forwarded-for");
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
      ipAddress: forwardedFor?.split(",")[0]?.trim() ?? null,
      userAgent: input.request?.headers.get("user-agent") ?? null,
    },
  });
}
