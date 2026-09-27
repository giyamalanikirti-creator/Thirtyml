import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    env: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
    time: new Date().toISOString(),
  });
}
