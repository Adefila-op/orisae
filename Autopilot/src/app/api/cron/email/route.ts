import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest, processPendingEmails } from "@/lib/agent-runtime";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await processPendingEmails());
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to process pending emails" },
      { status: 500 },
    );
  }
}
