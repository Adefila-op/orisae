import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest, runAgentCycle } from "@/lib/agent-runtime";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(
      await runAgentCycle({
        creatorLimit: Number(request.nextUrl.searchParams.get("creatorLimit") || 10),
        linkLimit: Number(request.nextUrl.searchParams.get("linkLimit") || 25),
        userLimit: Number(request.nextUrl.searchParams.get("userLimit") || 50),
      }),
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to run agent cron" },
      { status: 500 },
    );
  }
}
