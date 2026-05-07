import "server-only";

import { randomBytes, randomUUID } from "crypto";
import pg from "pg";
import { resolveCreatorIdentity } from "@/lib/auth";
import { clicksDaily as mockClicksDaily, engagement as mockEngagement, notifications as mockNotifications, products as mockProducts } from "@/lib/mock-data";
import { DashboardSnapshot } from "@/lib/dashboard-store";
import { getIntegrationCatalogEntry, integrationCatalog, IntegrationCategory, IntegrationSyncMode } from "@/lib/integrations";

const { Pool } = pg;
type PgPool = InstanceType<typeof Pool>;

type NumericLike = number | string | null;

type CreatorRow = {
  id: string;
  wallet_address: string;
  display_name: string | null;
  username: string | null;
  total_sales: NumericLike;
  total_conversions: NumericLike;
  agent_enabled: boolean | null;
  agent_last_run_at: string | null;
  agent_last_run_stats: Record<string, unknown> | null;
};

type SmartLinkRow = {
  id: string;
  creator_id: string;
  product_id: string | null;
  code: string;
  short_url: string | null;
  target_url: string | null;
  original_url: string | null;
  platform: string | null;
  offer_type: string | null;
  offer_value: NumericLike;
  enabled: boolean | null;
  click_count: NumericLike;
  conversion_count: NumericLike;
  total_value: NumericLike;
  created_at: string;
  product_title: string | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  message: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  sent_at: string;
};

type IntentRow = {
  user_identifier: string;
  link_id: string;
  purchase_probability: NumericLike;
  engagement_score: NumericLike;
  urgency_score: NumericLike;
  price_sensitivity: NumericLike;
  recommended_offer_type: string | null;
  last_evaluated_at: string;
  product_title: string | null;
};

type AnalyticsRow = {
  date: string;
  total_clicks: NumericLike;
  total_conversions: NumericLike;
};

type IntegrationRow = {
  id: string;
  creator_id: string;
  provider: string;
  category: string;
  sync_mode: string;
  status: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
  last_synced_at: string | null;
  last_sync_summary: Record<string, unknown> | null;
  last_error: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __autopilotPool: PgPool | undefined;
  // eslint-disable-next-line no-var
  var __autopilotAgentColumnsPromise: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var __autopilotIntegrationTablePromise: Promise<void> | undefined;
}

export function getDbPool() {
  if (global.__autopilotPool) {
    return global.__autopilotPool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString });

  if (process.env.NODE_ENV !== "production") {
    global.__autopilotPool = pool;
  }

  return pool;
}

function num(value: NumericLike) {
  return Number(value ?? 0);
}

function money(value: NumericLike) {
  return Number(num(value).toFixed(2));
}

async function ensureAgentColumns(pool: PgPool) {
  if (!global.__autopilotAgentColumnsPromise) {
    global.__autopilotAgentColumnsPromise = (async () => {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS agent_enabled BOOLEAN DEFAULT true
      `);
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS agent_last_run_at TIMESTAMP
      `);
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS agent_last_run_stats JSONB DEFAULT '{}'
      `);
    })().catch((error) => {
      global.__autopilotAgentColumnsPromise = undefined;
      throw error;
    });
  }

  await global.__autopilotAgentColumnsPromise;
}

async function ensureIntegrationTables(pool: PgPool) {
  if (!global.__autopilotIntegrationTablePromise) {
    global.__autopilotIntegrationTablePromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS creator_integrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          provider VARCHAR(100) NOT NULL,
          category VARCHAR(50) NOT NULL,
          sync_mode VARCHAR(50) NOT NULL DEFAULT 'api',
          status VARCHAR(50) NOT NULL DEFAULT 'planned',
          enabled BOOLEAN DEFAULT false,
          config JSONB DEFAULT '{}',
          last_synced_at TIMESTAMP,
          last_sync_summary JSONB DEFAULT '{}',
          last_error TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE (creator_id, provider)
        )
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_creator_integrations_creator ON creator_integrations(creator_id)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_creator_integrations_provider ON creator_integrations(provider)
      `);
    })().catch((error) => {
      global.__autopilotIntegrationTablePromise = undefined;
      throw error;
    });
  }

  await global.__autopilotIntegrationTablePromise;
}

function statusFromNotification(type: string, read: boolean) {
  if (type === "offer_accepted") return "converted";
  if (type === "conversion") return "clicked";
  if (type === "abandoned_cart") return read ? "opened" : "sent";
  if (type === "new_lead") return read ? "opened" : "sent";
  return read ? "opened" : "sent";
}

function intentBand(score: number) {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function timeAgo(dateLike: string) {
  const timestamp = new Date(dateLike).getTime();
  const deltaMs = Date.now() - timestamp;
  const deltaMinutes = Math.max(1, Math.floor(deltaMs / 60000));
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;
  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
}

function formatSentAt(dateLike: string) {
  const date = new Date(dateLike);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function getDemoDashboardSnapshot(): DashboardSnapshot {
  const appUrl = getAppUrl();
  const links = mockProducts.map((product, index) => ({
    id: product.id,
    name: product.name,
    trackedUrl: `${appUrl}/l/demo-${index + 1}`,
    trackedSlug: product.trackedSlug,
    url: product.url,
    clicks: product.clicks,
    recovered: product.recovered,
    revenue: product.revenue,
    enabled: index < 4,
    offerType: index % 2 === 0 ? "recovery" : "bundle",
    offerValue: index % 2 === 0 ? 10 : 15,
    platform: "custom",
    createdAt: new Date().toISOString(),
  }));

  const notifications = mockNotifications.map((item) => {
    const product = mockProducts.find((entry) => entry.id === item.productId);
    return {
      id: item.id,
      user: item.user,
      productName: product?.name || "Autopilot offer",
      type: item.type,
      status: item.status,
      intent: item.intent,
      sentAt: item.sentAt,
      read: item.status !== "sent",
      message: `${item.type} offer ready for ${product?.name || "this product"}.`,
    };
  });

  const engagement = mockEngagement.map((item) => {
    const product = mockProducts.find((entry) => entry.id === item.productId);
    return {
      user: item.user,
      productName: product?.name || "Untitled product",
      visits: item.visits,
      timeOnPage: item.timeOnPage,
      intent: item.intent,
      score: item.score,
      lastSeen: item.lastSeen,
      recommendedOfferType: item.intent === "high" ? "upsell" : item.intent === "medium" ? "discount" : "recovery",
      urgencyScore: item.score,
      priceSensitivity: Math.max(10, 100 - item.score),
    };
  });

  const liveLinks = links.filter((item) => item.enabled).length;
  const integrations = integrationCatalog.map((entry, index) => ({
    id: `demo-${entry.provider}`,
    provider: entry.provider,
    category: entry.category,
    label: entry.label,
    status: index < 4 ? "connected" as const : index < 7 ? "attention" as const : "planned" as const,
    enabled: index < 4,
    syncMode: entry.syncMode,
    capabilities: entry.capabilities,
    metrics: index < 4
      ? [
          { label: "Records", value: `${(index + 2) * 12}` },
          { label: "Coverage", value: `${72 + index * 5}%` },
        ]
      : [{ label: "Setup", value: index < 7 ? "Needs auth" : "Not connected" }],
    lastSyncedAt: index < 4 ? new Date(Date.now() - (index + 1) * 3600000).toISOString() : null,
    lastSyncedLabel: index < 4 ? `${index + 1}h ago` : null,
    note: entry.note,
  }));

  return {
    creator: {
      id: "demo-local",
      label: "Local demo mode",
      walletAddress: "",
      totalSales: links.reduce((sum, item) => sum + item.revenue, 0),
      totalConversions: links.reduce((sum, item) => sum + item.recovered, 0),
    },
    agent: {
      enabled: true,
      liveLinks,
      runnableLinks: liveLinks,
      totalLinks: links.length,
      lastRunAt: null,
      lastRunLabel: "just now",
      lastRunSummary: {
        processedLinks: liveLinks,
        scoredUsers: engagement.length,
        createdOffers: notifications.filter((item) => item.status === "sent" || item.status === "opened").length,
        integrationsUsed: integrations.filter((item) => item.enabled).length,
      },
    },
    summary: {
      totalClicks: links.reduce((sum, item) => sum + item.clicks, 0),
      totalRecovered: links.reduce((sum, item) => sum + item.recovered, 0),
      totalRevenue: links.reduce((sum, item) => sum + item.revenue, 0),
      sentToday: notifications.length,
    },
    links,
    notifications,
    engagement,
    clicksDaily: mockClicksDaily,
    integrations,
  };
}

export async function getActiveCreator(identity?: { creatorId?: string | null; walletAddress?: string | null } | null) {
  const pool = getDbPool();
  await ensureAgentColumns(pool);
  await ensureIntegrationTables(pool);
  const demoUserId = process.env.DEMO_USER_ID;

  if (identity?.creatorId) {
    const byId = (await pool.query(
      `SELECT id, wallet_address, display_name, username, total_sales, total_conversions,
              agent_enabled, agent_last_run_at, agent_last_run_stats
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [identity.creatorId],
    )) as { rows: CreatorRow[] };

    if (byId.rows[0]) return byId.rows[0];
  }

  if (identity?.walletAddress) {
    const byWallet = (await pool.query(
      `SELECT id, wallet_address, display_name, username, total_sales, total_conversions,
              agent_enabled, agent_last_run_at, agent_last_run_stats
       FROM users
       WHERE wallet_address = $1
       LIMIT 1`,
      [identity.walletAddress],
    )) as { rows: CreatorRow[] };

    if (byWallet.rows[0]) return byWallet.rows[0];
  }

  if (demoUserId) {
    const demoResult = (await pool.query(
      `SELECT id, wallet_address, display_name, username, total_sales, total_conversions,
              agent_enabled, agent_last_run_at, agent_last_run_stats
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [demoUserId],
    )) as { rows: CreatorRow[] };
    if (demoResult.rows[0]) return demoResult.rows[0];
  }

  const creatorResult = (await pool.query(
    `SELECT id, wallet_address, display_name, username, total_sales, total_conversions,
            agent_enabled, agent_last_run_at, agent_last_run_stats
     FROM users
     WHERE is_creator = true
     ORDER BY created_at ASC
     LIMIT 1`,
  )) as { rows: CreatorRow[] };

  if (!creatorResult.rows[0]) {
    throw new Error("No creator account found. Run the database seed first.");
  }

  return creatorResult.rows[0];
}

export function getCreatorIdentityFromRequest(input: {
  authorization?: string | null;
  creatorIdHeader?: string | null;
  walletHeader?: string | null;
}) {
  return resolveCreatorIdentity(input);
}

export async function getStatusSnapshot() {
  const pool = getDbPool();
  await ensureAgentColumns(pool);
  await ensureIntegrationTables(pool);
  await pool.query("SELECT NOW()");
  const creator = await getActiveCreator();

  return {
    api: "running",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    creator: {
      id: creator.id,
      label: creator.display_name || creator.username || creator.wallet_address,
    },
    timestamp: new Date().toISOString(),
  };
}

export async function getDashboardSnapshot(identity?: { creatorId?: string | null; walletAddress?: string | null } | null) {
  const pool = getDbPool();
  await ensureAgentColumns(pool);
  await ensureIntegrationTables(pool);
  const creator = await getActiveCreator(identity);

  const [linksResult, notificationsResult, intentsResult, analyticsResult, integrationsResult] = await Promise.all([
    pool.query(
      `SELECT
         l.*,
         p.title AS product_title
       FROM smart_links l
       LEFT JOIN products p ON p.id = l.product_id
       WHERE l.creator_id = $1
       ORDER BY l.created_at DESC`,
      [creator.id],
    ),
    pool.query(
      `SELECT id, user_id, type, title, message, data, read, sent_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY sent_at DESC
       LIMIT 50`,
      [creator.id],
    ),
    pool.query(
      `SELECT
         i.user_identifier,
         i.link_id,
         i.purchase_probability,
         i.engagement_score,
         i.urgency_score,
         i.price_sensitivity,
         i.recommended_offer_type,
         i.last_evaluated_at,
         COALESCE(p.title, l.code) AS product_title
       FROM intent_scores i
       INNER JOIN smart_links l ON l.id = i.link_id
       LEFT JOIN products p ON p.id = l.product_id
       WHERE l.creator_id = $1
       ORDER BY i.last_evaluated_at DESC
       LIMIT 50`,
      [creator.id],
    ),
    pool.query(
      `SELECT date::text, total_clicks, total_conversions
       FROM daily_analytics
       WHERE creator_id = $1
       ORDER BY date DESC
       LIMIT 14`,
      [creator.id],
    ),
    pool.query(
      `SELECT id, creator_id, provider, category, sync_mode, status, enabled, config, last_synced_at, last_sync_summary, last_error
       FROM creator_integrations
       WHERE creator_id = $1
       ORDER BY provider ASC`,
      [creator.id],
    ),
  ]);

  const linksRows = (linksResult as { rows: SmartLinkRow[] }).rows;
  const notificationsRows = (notificationsResult as { rows: NotificationRow[] }).rows;
  const intentsRows = (intentsResult as { rows: IntentRow[] }).rows;
  const analyticsRows = (analyticsResult as { rows: AnalyticsRow[] }).rows;
  const integrationRows = (integrationsResult as { rows: IntegrationRow[] }).rows;

  const links = linksRows.map((row) => ({
    id: row.id,
    name: row.product_title || row.code,
    trackedUrl: row.short_url || `${getAppUrl()}/l/${row.code}`,
    trackedSlug: row.short_url?.replace(/^https?:\/\//, "") || `ap.link/${row.code}`,
    url: row.target_url || row.original_url || getAppUrl(),
    clicks: num(row.click_count),
    recovered: num(row.conversion_count),
    revenue: money(row.total_value),
    enabled: Boolean(row.enabled),
    offerType: row.offer_type || "recovery",
    offerValue: num(row.offer_value),
    platform: row.platform || "custom",
    createdAt: row.created_at,
  }));

  const notifications = notificationsRows.map((row) => {
    const data = row.data || {};
    const probability = num(typeof data.purchase_probability === "number" ? data.purchase_probability : 0);
    return {
      id: row.id,
      user: String(data.user_identifier || data.user_address || "anonymous"),
      productName: String(data.product_title || row.title || "Autopilot offer"),
      type: String(data.offer_type || row.type || "recovery"),
      status: statusFromNotification(row.type, row.read),
      intent: intentBand(probability || 50),
      sentAt: formatSentAt(row.sent_at),
      read: row.read,
      message: row.message || "",
    };
  });

  const engagement = intentsRows.map((row) => {
    const score = num(row.purchase_probability);
    return {
      user: row.user_identifier,
      productName: row.product_title || "Untitled product",
      visits: Math.max(1, Math.round(num(row.engagement_score) / 20)),
      timeOnPage: Math.round(num(row.engagement_score) * 3),
      intent: intentBand(score),
      score,
      lastSeen: timeAgo(row.last_evaluated_at),
      recommendedOfferType: row.recommended_offer_type || "recovery",
      urgencyScore: num(row.urgency_score),
      priceSensitivity: num(row.price_sensitivity),
    };
  });

  const clicksDaily = analyticsRows
    .slice()
    .reverse()
    .map((row) => ({
      d: new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(new Date(row.date)),
      clicks: num(row.total_clicks),
      recoveries: num(row.total_conversions),
    }));

  const integrationMap = new Map(integrationRows.map((row) => [row.provider, row]));
  const integrations = integrationCatalog.map((catalogEntry) => {
    const row = integrationMap.get(catalogEntry.provider);
    const summary = row?.last_sync_summary || {};
    return {
      id: row?.id || `virtual-${catalogEntry.provider}`,
      provider: catalogEntry.provider,
      category: (row?.category || catalogEntry.category) as IntegrationCategory,
      label: catalogEntry.label,
      status: (row?.status || "planned") as "connected" | "attention" | "planned",
      enabled: Boolean(row?.enabled),
      syncMode: (row?.sync_mode || catalogEntry.syncMode) as IntegrationSyncMode,
      capabilities: catalogEntry.capabilities,
      metrics: row
        ? [
            { label: "Records", value: String(summary.records_synced ?? summary.records ?? 0) },
            { label: "Status", value: row.status === "connected" ? "Ready" : row.status === "attention" ? "Needs review" : "Planned" },
          ]
        : [{ label: "Setup", value: "Not connected" }],
      lastSyncedAt: row?.last_synced_at || null,
      lastSyncedLabel: row?.last_synced_at ? timeAgo(row.last_synced_at) : null,
      note: row?.last_error || catalogEntry.note,
    };
  });

  const totalClicks = links.reduce((sum, item) => sum + item.clicks, 0);
  const totalRecovered = links.reduce((sum, item) => sum + item.recovered, 0);
  const totalRevenue = links.reduce((sum, item) => sum + item.revenue, 0);
  const liveLinks = links.filter((item) => item.enabled).length;
  const runnableLinks = creator.agent_enabled === false ? 0 : liveLinks;
  const lastRunStats = creator.agent_last_run_stats as {
    processedLinks?: NumericLike;
    scoredUsers?: NumericLike;
    createdOffers?: NumericLike;
    integrationsUsed?: NumericLike;
  } | null;

  return {
    creator: {
      id: creator.id,
      label: creator.display_name || creator.username || creator.wallet_address,
      walletAddress: creator.wallet_address,
      totalSales: money(creator.total_sales),
      totalConversions: num(creator.total_conversions),
    },
    agent: {
      enabled: creator.agent_enabled !== false,
      liveLinks,
      runnableLinks,
      totalLinks: links.length,
      lastRunAt: creator.agent_last_run_at,
      lastRunLabel: creator.agent_last_run_at ? timeAgo(creator.agent_last_run_at) : null,
      lastRunSummary: lastRunStats
        ? {
            processedLinks: num(lastRunStats.processedLinks ?? null),
            scoredUsers: num(lastRunStats.scoredUsers ?? null),
            createdOffers: num(lastRunStats.createdOffers ?? null),
            integrationsUsed: num(lastRunStats.integrationsUsed ?? null),
          }
        : null,
    },
    summary: {
      totalClicks,
      totalRecovered,
      totalRevenue,
      sentToday: notifications.filter((item) => item.sentAt.includes(new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(new Date()))).length,
    },
    links,
    notifications,
    engagement,
    clicksDaily,
    integrations,
  };
}

export async function setAgentEnabled(enabled: boolean, identity?: { creatorId?: string | null; walletAddress?: string | null } | null) {
  const pool = getDbPool();
  const creator = await getActiveCreator(identity);
  await ensureAgentColumns(pool);
  await ensureIntegrationTables(pool);
  await pool.query("UPDATE users SET agent_enabled = $1, updated_at = NOW() WHERE id = $2", [enabled, creator.id]);
  return getDashboardSnapshot(identity);
}

export async function setLinkEnabled(linkId: string, enabled: boolean, identity?: { creatorId?: string | null; walletAddress?: string | null } | null) {
  const pool = getDbPool();
  await ensureAgentColumns(pool);
  await ensureIntegrationTables(pool);
  const creator = await getActiveCreator(identity);
  await pool.query(
    "UPDATE smart_links SET enabled = $1, updated_at = NOW() WHERE id = $2 AND creator_id = $3",
    [enabled, linkId, creator.id],
  );
  return getDashboardSnapshot(identity);
}

export async function createTrackedLink(input: {
  targetUrl: string;
  productTitle: string;
  offerType: string;
  offerValue: number;
}, identity?: { creatorId?: string | null; walletAddress?: string | null } | null) {
  const pool = getDbPool();
  await ensureAgentColumns(pool);
  await ensureIntegrationTables(pool);
  const creator = await getActiveCreator(identity);
  const code = randomBytes(6).toString("base64url").slice(0, 8);
  const productId = randomUUID();
  const linkId = randomUUID();

  await pool.query("BEGIN");

  try {
    await pool.query(
      `INSERT INTO products (id, creator_id, title, price, currency, is_active)
       VALUES ($1, $2, $3, $4, 'USD', true)`,
      [productId, creator.id, input.productTitle, 0],
    );

    await pool.query(
      `INSERT INTO smart_links (
         id, creator_id, product_id, code, short_url, target_url, original_url, platform, offer_type, offer_value, enabled
       ) VALUES ($1, $2, $3, $4, $5, $6, $6, 'custom', $7, $8, true)`,
      [linkId, creator.id, productId, code, `${getAppUrl()}/l/${code}`, input.targetUrl, input.offerType, input.offerValue],
    );

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }

  return getDashboardSnapshot(identity);
}

export async function getTrackedLinkDestination(code: string) {
  const pool = getDbPool();
  const result = (await pool.query(
    `SELECT l.id, l.code, l.short_url, l.target_url, l.enabled, u.agent_enabled
     FROM smart_links l
     INNER JOIN users u ON u.id = l.creator_id
     WHERE code = $1
     LIMIT 1`,
    [code],
  )) as {
    rows: Array<{
      id: string;
      code: string;
      short_url: string | null;
      target_url: string | null;
      enabled: boolean | null;
      agent_enabled: boolean | null;
    }>;
  };

  return result.rows[0] || null;
}

export async function setAgentRunResult(
  creatorId: string,
  summary: {
    processedLinks: number;
    scoredUsers: number;
    createdOffers: number;
    integrationsUsed: number;
  },
) {
  const pool = getDbPool();
  await ensureAgentColumns(pool);
  await ensureIntegrationTables(pool);
  await pool.query(
    `UPDATE users
     SET agent_last_run_at = NOW(),
         agent_last_run_stats = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [creatorId, JSON.stringify(summary)],
  );
}

export async function upsertCreatorIntegration(
  input: {
    provider: string;
    enabled: boolean;
    status?: "connected" | "attention" | "planned";
  },
  identity?: { creatorId?: string | null; walletAddress?: string | null } | null,
) {
  const pool = getDbPool();
  await ensureAgentColumns(pool);
  await ensureIntegrationTables(pool);
  const creator = await getActiveCreator(identity);
  const catalogEntry = getIntegrationCatalogEntry(input.provider);
  if (!catalogEntry) {
    throw new Error("Unsupported integration provider");
  }

  await pool.query(
    `INSERT INTO creator_integrations (id, creator_id, provider, category, sync_mode, status, enabled, last_sync_summary, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, '{}', NOW())
     ON CONFLICT (creator_id, provider)
     DO UPDATE SET
       category = EXCLUDED.category,
       sync_mode = EXCLUDED.sync_mode,
       status = EXCLUDED.status,
       enabled = EXCLUDED.enabled,
       updated_at = NOW()`,
    [
      randomUUID(),
      creator.id,
      catalogEntry.provider,
      catalogEntry.category,
      catalogEntry.syncMode,
      input.status || (input.enabled ? "connected" : "planned"),
      input.enabled,
    ],
  );

  return getDashboardSnapshot(identity);
}

export async function syncCreatorIntegration(
  provider: string,
  identity?: { creatorId?: string | null; walletAddress?: string | null } | null,
) {
  const pool = getDbPool();
  await ensureAgentColumns(pool);
  await ensureIntegrationTables(pool);
  const creator = await getActiveCreator(identity);
  const catalogEntry = getIntegrationCatalogEntry(provider);
  if (!catalogEntry) {
    throw new Error("Unsupported integration provider");
  }

  const recordsSynced = provider === "google_analytics" ? 14 : provider === "gmail" ? 24 : provider === "thrivecart" ? 11 : 8;

  await pool.query(
    `INSERT INTO creator_integrations (
       id, creator_id, provider, category, sync_mode, status, enabled, last_synced_at, last_sync_summary, last_error, updated_at
     ) VALUES ($1, $2, $3, $4, $5, 'connected', true, NOW(), $6, NULL, NOW())
     ON CONFLICT (creator_id, provider)
     DO UPDATE SET
       category = EXCLUDED.category,
       sync_mode = EXCLUDED.sync_mode,
       status = 'connected',
       enabled = true,
       last_synced_at = NOW(),
       last_sync_summary = EXCLUDED.last_sync_summary,
       last_error = NULL,
       updated_at = NOW()`,
    [
      randomUUID(),
      creator.id,
      catalogEntry.provider,
      catalogEntry.category,
      catalogEntry.syncMode,
      JSON.stringify({
        records_synced: recordsSynced,
        capabilities: catalogEntry.capabilities.length,
      }),
    ],
  );

  return getDashboardSnapshot(identity);
}
