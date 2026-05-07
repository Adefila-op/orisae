import { NextRequest, NextResponse } from "next/server";
import { createTrackedLink, getCreatorIdentityFromRequest, getDashboardSnapshot } from "@/lib/dashboard-data";

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
    return NextResponse.json(snapshot.links);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to load links" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      targetUrl?: string;
      productTitle?: string;
      offerType?: string;
      offerValue?: number;
    };

    if (!body.targetUrl || !body.productTitle) {
      return NextResponse.json(
        { error: "targetUrl and productTitle are required" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await createTrackedLink(
        {
          targetUrl: body.targetUrl,
          productTitle: body.productTitle,
          offerType: body.offerType || "recovery",
          offerValue: Number(body.offerValue ?? 10),
        },
        getCreatorIdentityFromRequest({
          authorization: request.headers.get("authorization"),
          creatorIdHeader: request.headers.get("x-creator-id"),
          walletHeader: request.headers.get("x-wallet-address"),
        }),
      ),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create link" },
      { status: 500 },
    );
  }
}
