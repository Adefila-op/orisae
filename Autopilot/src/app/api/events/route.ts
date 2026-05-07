import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "@/lib/agent-runtime";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      externalEventId?: string;
      linkCode?: string;
      linkId?: string;
      userIdentifier?: string;
      eventType?: "click" | "view" | "conversion" | "abandoned";
      amount?: number;
      referrer?: string;
      utmSource?: string;
      utmCampaign?: string;
      utmMedium?: string;
      deviceType?: string;
      browserInfo?: Record<string, unknown>;
      intentSignals?: Record<string, unknown>;
    };

    if ((!body.linkCode && !body.linkId) || !body.eventType) {
      return NextResponse.json(
        { error: "linkCode or linkId, and eventType are required" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await recordEvent({
        linkCode: body.linkCode,
        linkId: body.linkId,
        externalEventId: body.externalEventId,
        userIdentifier: body.userIdentifier,
        eventType: body.eventType,
        amount: Number(body.amount || 0),
        referrer: body.referrer,
        utmSource: body.utmSource,
        utmCampaign: body.utmCampaign,
        utmMedium: body.utmMedium,
        deviceType: body.deviceType,
        browserInfo: body.browserInfo,
        intentSignals: body.intentSignals,
      }),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to record event" },
      { status: 500 },
    );
  }
}
