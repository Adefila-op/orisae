import "server-only";

import { randomUUID } from "crypto";
import { getActiveCreator, getAppUrl, getDbPool, setAgentRunResult } from "@/lib/dashboard-data";

type EventType = "click" | "view" | "conversion" | "abandoned";

type EventInput = {
  externalEventId?: string;
  linkCode?: string;
  linkId?: string;
  userIdentifier?: string;
  eventType: EventType;
  amount?: number;
  referrer?: string;
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
  deviceType?: string;
  browserInfo?: Record<string, unknown>;
  intentSignals?: Record<string, unknown>;
};

type LinkRow = {
  id: string;
  creator_id: string;
  code: string;
  product_id: string | null;
  offer_type: string | null;
  offer_value: number | string | null;
  target_url: string | null;
  enabled: boolean;
  agent_enabled?: boolean | null;
  product_title: string | null;
};

type CreatorRow = {
  id: string;
  agent_enabled?: boolean | null;
};

type EventRow = {
  id: string;
  event_type: EventType;
  user_address: string | null;
  intent_signals: Record<string, unknown> | null;
  created_at: string;
};

function num(value: unknown) {
  return Number(value ?? 0);
}

function scoreIntentBand(score: number) {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function calculateEngagement(events: EventRow[]) {
  if (!events.length) return 0;
  const uniqueDays = new Set(events.map((event) => new Date(event.created_at).toDateString())).size;
  const views = events.filter((event) => event.event_type === "view").length;
  const clicks = events.filter((event) => event.event_type === "click").length;
  return Math.min(uniqueDays * 16 + views * 10 + clicks * 8, 100);
}

function calculatePriceSensitivity(events: EventRow[]) {
  if (!events.length) return 40;
  let score = 35;
  for (const event of events) {
    const signals = event.intent_signals || {};
    if (signals.price_checked) score += 12;
    if (signals.comparison_viewed) score += 10;
    if (signals.discount_clicked) score += 8;
    if (event.event_type === "abandoned") score += 14;
  }
  return Math.min(score, 100);
}

function calculateUrgency(events: EventRow[]) {
  if (!events.length) return 0;
  const now = Date.now();
  let score = 0;
  for (const event of events.slice(0, 8)) {
    const minutesAgo = (now - new Date(event.created_at).getTime()) / 60000;
    if (minutesAgo < 10) score += 22;
    else if (minutesAgo < 60) score += 12;
    else if (minutesAgo < 720) score += 6;
  }
  return Math.min(score, 100);
}

function calculatePurchaseProbability(engagement: number, priceSensitivity: number, urgency: number) {
  const weighted = engagement * 0.45 + urgency * 0.35 + (100 - priceSensitivity) * 0.2;
  return Math.max(0, Math.min(Math.round(weighted), 100));
}

function recommendOffer(purchaseProbability: number, priceSensitivity: number, urgency: number) {
  if (purchaseProbability >= 80) {
    return { offerType: "upsell", offerValue: 0 };
  }
  if (purchaseProbability >= 60) {
    return priceSensitivity >= 55
      ? { offerType: "discount", offerValue: 10 }
      : { offerType: "bundle", offerValue: 15 };
  }
  if (urgency >= 60 || priceSensitivity >= 70) {
    return { offerType: "recovery", offerValue: 20 };
  }
  return { offerType: "recovery", offerValue: 12 };
}

async function getLinkByReference(linkId?: string, linkCode?: string) {
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT l.*, p.title AS product_title, u.agent_enabled
     FROM smart_links l
     LEFT JOIN products p ON p.id = l.product_id
     INNER JOIN users u ON u.id = l.creator_id
     WHERE ($1::uuid IS NOT NULL AND l.id = $1::uuid)
        OR ($2::text IS NOT NULL AND l.code = $2::text)
     LIMIT 1`,
    [linkId || null, linkCode || null],
  );

  return (result as { rows: LinkRow[] }).rows[0] || null;
}

async function findDuplicateEvent(linkId: string, userIdentifier: string, eventType: EventType, externalEventId?: string) {
  const pool = getDbPool();
  if (externalEventId) {
    const byExternal = await pool.query(
      `SELECT id
       FROM user_events
       WHERE link_id = $1
         AND event_type = $2
         AND user_address = $3
         AND intent_signals->>'external_event_id' = $4
       LIMIT 1`,
      [linkId, eventType, userIdentifier, externalEventId],
    );
    if ((byExternal as { rows: Array<{ id: string }> }).rows[0]) {
      return true;
    }
  }

  const recentDuplicate = await pool.query(
    `SELECT id
     FROM user_events
     WHERE link_id = $1
       AND event_type = $2
       AND user_address = $3
       AND created_at > NOW() - INTERVAL '30 seconds'
     LIMIT 1`,
    [linkId, eventType, userIdentifier],
  );

  return Boolean((recentDuplicate as { rows: Array<{ id: string }> }).rows[0]);
}

export async function recordEvent(input: EventInput) {
  const pool = getDbPool();
  const link = await getLinkByReference(input.linkId, input.linkCode);
  if (!link) {
    throw new Error("Tracked link not found");
  }

  if (!link.enabled || link.agent_enabled === false) {
    return {
      ok: true,
      deduped: false,
      skipped: true,
      linkId: link.id,
      linkCode: link.code,
      userIdentifier: input.userIdentifier || null,
      eventType: input.eventType,
    };
  }

  const eventId = randomUUID();
  const userIdentifier = input.userIdentifier || `anon:${eventId.slice(0, 12)}`;
  const intentSignals = {
    ...(input.intentSignals || {}),
    amount: input.amount || 0,
    external_event_id: input.externalEventId || null,
  };

  const duplicate = await findDuplicateEvent(
    link.id,
    userIdentifier,
    input.eventType,
    input.externalEventId,
  );
  if (duplicate) {
    return {
      ok: true,
      deduped: true,
      linkId: link.id,
      linkCode: link.code,
      userIdentifier,
      eventType: input.eventType,
    };
  }

  await pool.query(
    `INSERT INTO user_events (
       id, link_id, user_address, event_type, browser_info, device_type, referrer,
       utm_source, utm_campaign, utm_medium, intent_signals, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
    [
      eventId,
      link.id,
      userIdentifier,
      input.eventType,
      JSON.stringify(input.browserInfo || {}),
      input.deviceType || null,
      input.referrer || null,
      input.utmSource || null,
      input.utmCampaign || null,
      input.utmMedium || null,
      JSON.stringify(intentSignals),
    ],
  );

  if (input.eventType === "click") {
    await pool.query(
      "UPDATE smart_links SET click_count = click_count + 1, updated_at = NOW() WHERE id = $1",
      [link.id],
    );
  }

  if (input.eventType === "conversion") {
    await pool.query(
      `UPDATE smart_links
       SET conversion_count = conversion_count + 1,
           total_value = total_value + $2,
           updated_at = NOW()
       WHERE id = $1`,
      [link.id, input.amount || 0],
    );

    await pool.query(
      `UPDATE users
       SET total_sales = total_sales + $2,
           total_conversions = total_conversions + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [link.creator_id, input.amount || 0],
    );

    await upsertNotificationAndEmail({
      creatorId: link.creator_id,
      type: "conversion",
      title: `${link.product_title || link.code} converted`,
      message: `${userIdentifier} completed a tracked purchase worth $${Number(input.amount || 0).toFixed(2)}.`,
      data: {
        link_id: link.id,
        link_code: link.code,
        product_title: link.product_title || link.code,
        user_identifier: userIdentifier,
        amount: Number(input.amount || 0),
        purchase_probability: 100,
        offer_type: link.offer_type || "conversion",
      },
    });
  }

  return {
    ok: true,
    deduped: false,
    linkId: link.id,
    linkCode: link.code,
    userIdentifier,
    eventType: input.eventType,
  };
}

async function upsertNotificationAndEmail(params: {
  creatorId: string;
  type: "conversion" | "abandoned_cart" | "new_lead" | "offer_accepted";
  title: string;
  message: string;
  data: Record<string, unknown>;
}) {
  const pool = getDbPool();
  const dedupeKey = JSON.stringify({
    type: params.type,
    link_id: params.data.link_id || null,
    user_identifier: params.data.user_identifier || null,
    offer_type: params.data.offer_type || null,
    amount: params.data.amount || null,
  });

  const existing = await pool.query(
    `SELECT id
     FROM notifications
     WHERE user_id = $1
       AND type = $2
       AND sent_at > NOW() - INTERVAL '24 hours'
       AND data->>'dedupe_key' = $3
     LIMIT 1`,
    [params.creatorId, params.type, dedupeKey],
  );

  const existingId = (existing as { rows: Array<{ id: string }> }).rows[0]?.id;
  if (existingId) {
    return existingId;
  }

  const notificationId = randomUUID();

  await pool.query(
    `INSERT INTO notifications (id, user_id, type, title, message, data, read, sent_at, email_sent)
     VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), false)`,
    [
      notificationId,
      params.creatorId,
      params.type,
      params.title,
      params.message,
      JSON.stringify({ ...params.data, dedupe_key: dedupeKey }),
    ],
  );

  const creatorResult = await pool.query(
    "SELECT email, display_name, username FROM users WHERE id = $1 LIMIT 1",
    [params.creatorId],
  );
  const creator = (creatorResult as { rows: Array<{ email: string | null; display_name: string | null; username: string | null }> }).rows[0];

  if (creator?.email) {
    const emailId = randomUUID();
    const template =
      params.type === "conversion"
        ? "conversion_notification"
        : params.type === "abandoned_cart"
          ? "abandoned_cart"
          : "offer_alert";

    await pool.query(
      `INSERT INTO email_queue (
         id, user_id, recipient_email, notification_id, template, data, status, retry_count, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', 0, NOW())`,
      [
        emailId,
        params.creatorId,
        creator.email,
        notificationId,
        template,
        JSON.stringify({
          subject: params.title,
          creator_name: creator.display_name || creator.username || "Creator",
          ...params.data,
        }),
      ],
    );
  }

  return notificationId;
}

async function ensureOfferForIntent(link: LinkRow, intentScoreId: string, userIdentifier: string, score: number, offerType: string, offerValue: number) {
  const pool = getDbPool();
  if (score < 50) {
    return { created: false };
  }

  const existing = await pool.query(
    `SELECT id
     FROM offers
     WHERE link_id = $1
       AND created_at > NOW() - INTERVAL '48 hours'
       AND decision_rationale->>'user_identifier' = $2
     LIMIT 1`,
    [link.id, userIdentifier],
  );

  if ((existing as { rows: Array<{ id: string }> }).rows[0]) {
    return { created: false };
  }

  const offerId = randomUUID();
  const productName = link.product_title || `Link ${link.code}`;
  const offerText =
    offerType === "discount"
      ? `${offerValue}% recovery discount for ${productName}`
      : offerType === "bundle"
        ? `Bundle follow-up for ${productName}`
        : offerType === "upsell"
          ? `Upsell suggestion for ${productName}`
          : `Recovery offer for ${productName}`;

  await pool.query(
    `INSERT INTO offers (
       id, link_id, intent_score_id, offer_type, discount_percent, offer_text, expires_at, is_accepted, decision_rationale, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '72 hours', false, $7, NOW())`,
    [
      offerId,
      link.id,
      intentScoreId,
      offerType,
      offerValue,
      offerText,
      JSON.stringify({
        user_identifier: userIdentifier,
        purchase_probability: score,
        generated_by: "vercel-agent-cycle",
      }),
    ],
  );

  const notificationType = score >= 70 ? "new_lead" : "abandoned_cart";
  await upsertNotificationAndEmail({
    creatorId: link.creator_id,
    type: notificationType,
    title: `${productName} needs follow-up`,
    message: `${userIdentifier} reached ${score}% purchase probability. Recommended ${offerType} offer is ready.`,
    data: {
      link_id: link.id,
      link_code: link.code,
      product_title: productName,
      user_identifier: userIdentifier,
      offer_type: offerType,
      offer_value: offerValue,
      purchase_probability: score,
    },
  });

  return { created: true, offerId };
}

async function evaluateIntentForLinkUser(link: LinkRow, userIdentifier: string) {
  const pool = getDbPool();
  const eventsResult = await pool.query(
    `SELECT id, event_type, user_address, intent_signals, created_at
     FROM user_events
     WHERE link_id = $1 AND user_address = $2
     ORDER BY created_at DESC
     LIMIT 100`,
    [link.id, userIdentifier],
  );

  const events = (eventsResult as { rows: EventRow[] }).rows;
  if (!events.length) {
    return { updated: false, createdOffer: false };
  }

  const engagementScore = calculateEngagement(events);
  const priceSensitivity = calculatePriceSensitivity(events);
  const urgencyScore = calculateUrgency(events);
  const purchaseProbability = calculatePurchaseProbability(engagementScore, priceSensitivity, urgencyScore);
  const recommendation = recommendOffer(purchaseProbability, priceSensitivity, urgencyScore);
  const intentId = randomUUID();

  await pool.query(
    `INSERT INTO intent_scores (
       id, link_id, user_identifier, engagement_score, price_sensitivity, urgency_score,
       purchase_probability, recommended_offer_type, recommended_offer_value, last_evaluated_at, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
     ON CONFLICT (link_id, user_identifier)
     DO UPDATE SET
       engagement_score = EXCLUDED.engagement_score,
       price_sensitivity = EXCLUDED.price_sensitivity,
       urgency_score = EXCLUDED.urgency_score,
       purchase_probability = EXCLUDED.purchase_probability,
       recommended_offer_type = EXCLUDED.recommended_offer_type,
       recommended_offer_value = EXCLUDED.recommended_offer_value,
       last_evaluated_at = NOW(),
       updated_at = NOW()`,
    [
      intentId,
      link.id,
      userIdentifier,
      engagementScore,
      priceSensitivity,
      urgencyScore,
      purchaseProbability,
      recommendation.offerType,
      recommendation.offerValue,
    ],
  );

  const offer = await ensureOfferForIntent(
    link,
    intentId,
    userIdentifier,
    purchaseProbability,
    recommendation.offerType,
    recommendation.offerValue,
  );

  return {
    updated: true,
    createdOffer: offer.created,
    purchaseProbability,
    intent: scoreIntentBand(purchaseProbability),
  };
}

async function listCreators(limit: number) {
  const pool = getDbPool();
  const creatorsResult = await pool.query(
    `SELECT id, agent_enabled
     FROM users
     WHERE is_creator = true
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit],
  );
  return (creatorsResult as { rows: CreatorRow[] }).rows;
}

async function countActiveIntegrations(creatorId: string) {
  const pool = getDbPool();
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM creator_integrations
       WHERE creator_id = $1
         AND enabled = true
         AND status = 'connected'`,
      [creatorId],
    );

    return Number((result as { rows: Array<{ total: number | string }> }).rows[0]?.total || 0);
  } catch {
    return 0;
  }
}

export async function runAgentCycle(options?: {
  creatorId?: string | null;
  walletAddress?: string | null;
  creatorLimit?: number;
  linkLimit?: number;
  userLimit?: number;
}) {
  const pool = getDbPool();

  const creatorTargets = options?.creatorId || options?.walletAddress
    ? [await getActiveCreator({ creatorId: options.creatorId || null, walletAddress: options.walletAddress || null })]
    : await listCreators(options?.creatorLimit || 10);

  let processedLinks = 0;
  let scoredUsers = 0;
  let createdOffers = 0;
  let skippedCreators = 0;

  for (const creator of creatorTargets) {
    if (creator.agent_enabled === false) {
      skippedCreators += 1;
      continue;
    }

    let creatorProcessedLinks = 0;
    let creatorScoredUsers = 0;
    let creatorCreatedOffers = 0;

    const linksResult = await pool.query(
      `SELECT l.*, p.title AS product_title
       FROM smart_links l
       LEFT JOIN products p ON p.id = l.product_id
       WHERE l.creator_id = $1 AND l.enabled = true
       ORDER BY l.updated_at DESC
       LIMIT $2`,
      [creator.id, options?.linkLimit || 25],
    );
    const links = (linksResult as { rows: LinkRow[] }).rows;

    for (const link of links) {
      processedLinks += 1;
      creatorProcessedLinks += 1;
      const usersResult = await pool.query(
        `SELECT DISTINCT user_address
         FROM user_events
         WHERE link_id = $1
           AND user_address IS NOT NULL
           AND created_at > NOW() - INTERVAL '14 days'
         ORDER BY user_address
         LIMIT $2`,
        [link.id, options?.userLimit || 50],
      );

      const users = (usersResult as { rows: Array<{ user_address: string }> }).rows;
      for (const user of users) {
        const result = await evaluateIntentForLinkUser(link, user.user_address);
        if (result.updated) {
          scoredUsers += 1;
          creatorScoredUsers += 1;
        }
        if (result.createdOffer) {
          createdOffers += 1;
          creatorCreatedOffers += 1;
        }
      }
    }

    const integrationsUsed = await countActiveIntegrations(creator.id);

    await setAgentRunResult(creator.id, {
      processedLinks: creatorProcessedLinks,
      scoredUsers: creatorScoredUsers,
      createdOffers: creatorCreatedOffers,
      integrationsUsed,
    });
  }

  return {
    ok: true,
    creatorsProcessed: creatorTargets.length,
    skippedCreators,
    processedLinks,
    scoredUsers,
    createdOffers,
  };
}

export async function aggregateAnalytics(options?: { creatorId?: string | null; walletAddress?: string | null; creatorLimit?: number }) {
  const pool = getDbPool();
  const today = new Date().toISOString().split("T")[0];
  const creatorTargets = options?.creatorId || options?.walletAddress
    ? [await getActiveCreator({ creatorId: options.creatorId || null, walletAddress: options.walletAddress || null })]
    : await listCreators(options?.creatorLimit || 50);

  const summaries = [];

  for (const creator of creatorTargets) {
    const totalsResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE event_type = 'click') AS total_clicks,
         COUNT(*) FILTER (WHERE event_type = 'conversion') AS total_conversions,
         COALESCE(SUM((intent_signals->>'amount')::numeric) FILTER (WHERE event_type = 'conversion'), 0) AS total_value
       FROM user_events
       WHERE link_id IN (SELECT id FROM smart_links WHERE creator_id = $1)
         AND DATE(created_at) = $2`,
      [creator.id, today],
    );

    const topOfferResult = await pool.query(
      `SELECT offer_type
       FROM offers
       WHERE link_id IN (SELECT id FROM smart_links WHERE creator_id = $1)
         AND DATE(created_at) = $2
       GROUP BY offer_type
       ORDER BY COUNT(*) DESC
       LIMIT 1`,
      [creator.id, today],
    );

    const avgIntentResult = await pool.query(
      `SELECT COALESCE(AVG(purchase_probability), 0) AS avg_intent
       FROM intent_scores
       WHERE link_id IN (SELECT id FROM smart_links WHERE creator_id = $1)
         AND DATE(updated_at) = $2`,
      [creator.id, today],
    );

    const totals = (totalsResult as { rows: Array<{ total_clicks: unknown; total_conversions: unknown; total_value: unknown }> }).rows[0];
    const topOffer = (topOfferResult as { rows: Array<{ offer_type: string }> }).rows[0]?.offer_type || "recovery";
    const avgIntent = (avgIntentResult as { rows: Array<{ avg_intent: unknown }> }).rows[0];

    await pool.query(
      `INSERT INTO daily_analytics (
         id, creator_id, date, total_clicks, total_conversions, total_value, avg_intent_score, top_offer_type, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (creator_id, date)
       DO UPDATE SET
         total_clicks = EXCLUDED.total_clicks,
         total_conversions = EXCLUDED.total_conversions,
         total_value = EXCLUDED.total_value,
         avg_intent_score = EXCLUDED.avg_intent_score,
         top_offer_type = EXCLUDED.top_offer_type`,
      [
        randomUUID(),
        creator.id,
        today,
        num(totals.total_clicks),
        num(totals.total_conversions),
        num(totals.total_value),
        num(avgIntent.avg_intent),
        topOffer,
      ],
    );

    summaries.push({
      creatorId: creator.id,
      totalClicks: num(totals.total_clicks),
      totalConversions: num(totals.total_conversions),
      totalValue: num(totals.total_value),
      avgIntent: num(avgIntent.avg_intent),
      topOfferType: topOffer,
    });
  }

  return {
    ok: true,
    date: today,
    creatorsProcessed: creatorTargets.length,
    summaries,
  };
}

function generateEmailHtml(subject: string, message: string, ctaUrl: string) {
  return `
    <html>
      <body style="font-family: Inter, Arial, sans-serif; background:#f6f8ff; color:#111827; padding:24px;">
        <div style="max-width:620px; margin:0 auto; background:white; border-radius:24px; overflow:hidden;">
          <div style="padding:28px 32px; background:linear-gradient(135deg,#2d8cff,#4f74ff); color:white;">
            <h1 style="margin:0; font-size:24px;">${subject}</h1>
          </div>
          <div style="padding:32px;">
            <p style="font-size:15px; line-height:1.8; color:#475569;">${message}</p>
            <a href="${ctaUrl}" style="display:inline-block; margin-top:20px; padding:14px 20px; border-radius:14px; background:#2d8cff; color:white; text-decoration:none; font-weight:600;">
              Open Autopilot
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function processPendingEmails(limit = 20) {
  const pool = getDbPool();
  const queueResult = await pool.query(
    `SELECT id, recipient_email, notification_id, template, data
     FROM email_queue
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit],
  );

  const rows = (queueResult as {
    rows: Array<{
      id: string;
      recipient_email: string;
      notification_id: string | null;
      template: string;
      data: Record<string, unknown> | null;
    }>;
  }).rows;

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "noreply@autopilot.app";
  const appUrl = `${getAppUrl()}/dashboard`;

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const data = row.data || {};
    const subject = String(data.subject || "Autopilot update");
    const message =
      String(data.message || data.offer_text || "Your Autopilot agent has a new update ready.");

    if (!resendKey) {
      await pool.query(
        `UPDATE email_queue SET status = 'failed', last_error = $2, retry_count = retry_count + 1 WHERE id = $1`,
        [row.id, "RESEND_API_KEY is not configured"],
      );
      failed += 1;
      continue;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: row.recipient_email,
          subject,
          html: generateEmailHtml(subject, message, appUrl),
        }),
      });

      if (!response.ok) {
        throw new Error(`Resend returned ${response.status}`);
      }

      await pool.query(
        `UPDATE email_queue SET status = 'sent', sent_at = NOW(), last_error = NULL WHERE id = $1`,
        [row.id],
      );

      if (row.notification_id) {
        await pool.query(
          `UPDATE notifications SET email_sent = true, email_sent_at = NOW() WHERE id = $1`,
          [row.notification_id],
        );
      }

      sent += 1;
    } catch (error) {
      await pool.query(
        `UPDATE email_queue
         SET status = CASE WHEN retry_count + 1 >= 3 THEN 'failed' ELSE 'pending' END,
             retry_count = retry_count + 1,
             last_error = $2
         WHERE id = $1`,
        [row.id, (error as Error).message],
      );
      failed += 1;
    }
  }

  return { ok: true, queued: rows.length, sent, failed };
}

export function isAuthorizedCronRequest(authHeader: string | null) {
  if (!process.env.CRON_SECRET) {
    return false;
  }
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}
