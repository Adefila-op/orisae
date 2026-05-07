import { NextResponse } from "next/server";
import { getCreatorIdentityFromRequest, getDashboardSnapshot } from "@/lib/dashboard-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    return NextResponse.json(
      await getDashboardSnapshot(
        getCreatorIdentityFromRequest({
          authorization: request.headers.get("authorization"),
          creatorIdHeader: request.headers.get("x-creator-id"),
          walletHeader: request.headers.get("x-wallet-address"),
        }),
      ),
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}
