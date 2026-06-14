import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const startedAt = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - startedAt);
    await prisma.healthCheck.create({
      data: {
        status: "UP",
        database: "UP",
        latencyMs,
        message: "Database query berhasil.",
      },
    });
    return NextResponse.json({
      status: "UP",
      database: "UP",
      latencyMs,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "DOWN",
        database: "DOWN",
        message: error instanceof Error ? error.message : "Database tidak tersedia.",
        checkedAt: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
