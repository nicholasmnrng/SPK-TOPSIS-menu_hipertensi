import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { AppRole, AuthorizationError, isAppRole } from "@/lib/rbac/permissions";

export type AppSessionUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
};

export const auth = betterAuth({
  appName: "SPK Menu Hipertensi",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "development-only-spk-menu-hipertensi-change-before-production",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { status: true, banned: true },
          });
          if (!user || user.status !== "ACTIVE" || user.banned) {
            throw new APIError("FORBIDDEN", {
              message:
                user?.status === "PENDING"
                  ? "Akun menunggu persetujuan Admin."
                  : "Akun sedang ditangguhkan.",
              code: "ACCOUNT_NOT_ACTIVE",
            });
          }
        },
        after: async (session) => {
          await prisma.auditLog.create({
            data: {
              actorId: session.userId,
              action: "LOGIN",
              entityType: "session",
              entityId: session.id,
            },
          });
        },
      },
    },
  },
  user: {
    additionalFields: {
      status: {
        type: ["PENDING", "ACTIVE", "SUSPENDED"],
        required: false,
        defaultValue: "PENDING",
        input: false,
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "USER",
      bannedUserMessage: "Akun Anda sedang ditangguhkan.",
    }),
  ],
});

export async function getCurrentUser(
  requestHeaders?: Headers,
  options: { allowInactive?: boolean } = {},
): Promise<AppSessionUser> {
  const session = await auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
  });

  if (!session?.user?.id) {
    throw new AuthorizationError("Unauthenticated", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      deletedAt: true,
      banned: true,
    },
  });

  if (!user || user.deletedAt || !isAppRole(user.role)) {
    throw new AuthorizationError("Akun tidak valid.", 403);
  }

  if (!options.allowInactive && (user.status !== "ACTIVE" || user.banned)) {
    throw new AuthorizationError(
      user.status === "PENDING"
        ? "Akun menunggu persetujuan Admin."
        : "Akun sedang ditangguhkan.",
      403,
    );
  }

  return {
    id: user.id,
    name: user.name ?? user.email,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}
