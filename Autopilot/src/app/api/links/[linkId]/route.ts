import { NextRequest, NextResponse } from "next/server";
import { getCreatorIdentityFromRequest, setLinkEnabled } from "@/lib/dashboard-data";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { linkId: string } },
) {
  try {
    const body = (await request.json()) as { enabled?: boolean };
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }

    return NextResponse.json(
      await setLinkEnabled(
        params.linkId,
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
      { error: (error as Error).message || "Failed to update link state" },
      { status: 500 },
    );
  }
}
