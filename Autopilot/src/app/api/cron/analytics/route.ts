import { NextRequest, NextResponse } from "next/server";
import { aggregateAnalytics, isAuthorizedCronRequest } from "@/lib/agent-runtime";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(
      await aggregateAnalytics({
        creatorLimit: Number(request.nextUrl.searchParams.get("creatorLimit") || 50),
      }),
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to aggregate analytics" },
      { status: 500 },
    );
  }
}
