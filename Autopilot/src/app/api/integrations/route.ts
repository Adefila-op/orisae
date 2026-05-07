import { NextRequest, NextResponse } from "next/server";
import { getCreatorIdentityFromRequest, getDashboardSnapshot, syncCreatorIntegration, upsertCreatorIntegration } from "@/lib/dashboard-data";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const snapshot = await getDashboardSnapshot(
      getCreatorIdentityFromRequest({
        authorization: request.headers.get("authorization"),
        creatorIdHeader: request.headers.get("x-creator-id"),
        walletHeader: request.headers.get("x-wallet-address"),
      }),
    );
    return NextResponse.json(snapshot.integrations);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to load integrations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      provider?: string;
      enabled?: boolean;
      action?: "connect" | "sync";
    };

    if (!body.provider) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 });
    }

    const identity = getCreatorIdentityFromRequest({
      authorization: request.headers.get("authorization"),
      creatorIdHeader: request.headers.get("x-creator-id"),
      walletHeader: request.headers.get("x-wallet-address"),
    });

    if (body.action === "sync") {
      return NextResponse.json(await syncCreatorIntegration(body.provider, identity));
    }

    return NextResponse.json(
      await upsertCreatorIntegration(
        {
          provider: body.provider,
          enabled: body.enabled ?? true,
          status: body.enabled === false ? "planned" : "connected",
        },
        identity,
      ),
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update integration" },
      { status: 500 },
    );
  }
}
