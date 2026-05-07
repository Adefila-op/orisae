import { NextResponse } from "next/server";
import { getStatusSnapshot } from "@/lib/dashboard-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getStatusSnapshot());
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Status check failed" },
      { status: 503 },
    );
  }
}
