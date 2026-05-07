import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "@/lib/agent-runtime";
import { getTrackedLinkDestination } from "@/lib/dashboard-data";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } },
) {
  const link = await getTrackedLinkDestination(params.code);

  if (!link?.target_url) {
    return NextResponse.json({ error: "Tracked link not found" }, { status: 404 });
  }

  try {
    if (link.enabled && link.agent_enabled !== false) {
      await recordEvent({
        linkCode: params.code,
        eventType: "click",
        referrer: request.headers.get("referer") || undefined,
        deviceType: request.headers.get("sec-ch-ua-mobile") === "?1" ? "mobile" : "desktop",
        browserInfo: {
          userAgent: request.headers.get("user-agent") || undefined,
        },
      });
    }
  } catch (error) {
    console.error("Failed to track click before redirect", error);
  }

  return NextResponse.redirect(link.target_url, { status: 307 });
}
