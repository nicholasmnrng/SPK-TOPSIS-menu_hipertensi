import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    { error: { code: "ENDPOINT_REPLACED", message: "Gunakan /api/foods." } },
    { status: 410 },
  );
}
