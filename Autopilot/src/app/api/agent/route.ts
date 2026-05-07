import { NextRequest, NextResponse } from "next/server";
import { getCreatorIdentityFromRequest, setAgentEnabled } from "@/lib/dashboard-data";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL is not configured in Vercel production envs" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { enabled?: boolean };
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }

    return NextResponse.json(
      await setAgentEnabled(
        body.enabled,
        getCreatorIdentityFromRequest({
          authorization: request.headers.get("authorization"),
          creatorIdHeader: request.headers.get("x-creator-id"),
          walletHeader: request.headers.get("x-wallet-address"),
        }),
      ),
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update agent state" },
      { status: 500 },
    );
  }
}
