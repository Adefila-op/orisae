import { NextResponse } from "next/server";
import { runAgentCycle } from "@/lib/agent-runtime";
import { getCreatorIdentityFromRequest } from "@/lib/dashboard-data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL is not configured in Vercel production envs" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      await runAgentCycle({
        ...getCreatorIdentityFromRequest({
          authorization: request.headers.get("authorization"),
          creatorIdHeader: request.headers.get("x-creator-id"),
          walletHeader: request.headers.get("x-wallet-address"),
        }),
        creatorLimit: 1,
        linkLimit: 20,
        userLimit: 50,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to run agent cycle" },
      { status: 500 },
    );
  }
}
