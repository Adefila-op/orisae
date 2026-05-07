import { NextRequest, NextResponse } from "next/server";
import { getCreatorIdentityFromRequest, syncCreatorIntegration, upsertCreatorIntegration } from "@/lib/dashboard-data";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  try {
    const body = (await request.json()) as {
      enabled?: boolean;
      action?: "sync";
    };

    const identity = getCreatorIdentityFromRequest({
      authorization: request.headers.get("authorization"),
      creatorIdHeader: request.headers.get("x-creator-id"),
      walletHeader: request.headers.get("x-wallet-address"),
    });

    if (body.action === "sync") {
      return NextResponse.json(await syncCreatorIntegration(params.provider, identity));
    }

    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }

    return NextResponse.json(
      await upsertCreatorIntegration(
        {
          provider: params.provider,
          enabled: body.enabled,
          status: body.enabled ? "connected" : "planned",
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
