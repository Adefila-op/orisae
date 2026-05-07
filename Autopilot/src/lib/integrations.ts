import "server-only";

export type IntegrationProvider =
  | "gmail"
  | "google_calendar"
  | "google_drive"
  | "notion"
  | "airtable"
  | "google_analytics"
  | "metricool"
  | "mailchimp"
  | "kit"
  | "gumroad"
  | "thrivecart";

export type IntegrationCategory = "communication" | "storage" | "crm" | "analytics" | "sales" | "scheduling";
export type IntegrationSyncMode = "api" | "mcp" | "webhook" | "manual";

export type IntegrationCatalogEntry = {
  provider: IntegrationProvider;
  label: string;
  category: IntegrationCategory;
  syncMode: IntegrationSyncMode;
  capabilities: string[];
  note: string;
};

export const integrationCatalog: IntegrationCatalogEntry[] = [
  {
    provider: "gmail",
    label: "Gmail",
    category: "communication",
    syncMode: "mcp",
    capabilities: ["read inbox", "send follow-ups", "label messages"],
    note: "Use Gmail to read creator replies and send recovery follow-ups.",
  },
  {
    provider: "google_calendar",
    label: "Google Calendar",
    category: "scheduling",
    syncMode: "mcp",
    capabilities: ["plan launches", "schedule follow-ups", "manage timelines"],
    note: "Calendar gives the worker campaign timing and launch windows.",
  },
  {
    provider: "google_drive",
    label: "Google Drive",
    category: "storage",
    syncMode: "mcp",
    capabilities: ["store assets", "fetch docs", "share reports"],
    note: "Drive stores creator assets, reports, and export files for the worker.",
  },
  {
    provider: "notion",
    label: "Notion",
    category: "crm",
    syncMode: "mcp",
    capabilities: ["read tracker", "update content plans", "write notes"],
    note: "Notion is ideal for creator pipelines, content calendars, and offer ops.",
  },
  {
    provider: "airtable",
    label: "Airtable",
    category: "crm",
    syncMode: "api",
    capabilities: ["sync records", "update funnels", "track offers"],
    note: "Airtable acts as a structured CRM and offer database for the agent.",
  },
  {
    provider: "google_analytics",
    label: "Google Analytics",
    category: "analytics",
    syncMode: "api",
    capabilities: ["pull traffic", "report conversions", "compare pages"],
    note: "GA4 feeds high-level traffic and conversion trends into agent decisions.",
  },
  {
    provider: "metricool",
    label: "Metricool",
    category: "analytics",
    syncMode: "api",
    capabilities: ["collect social metrics", "track post performance", "export reports"],
    note: "Metricool gives the worker social distribution and campaign performance data.",
  },
  {
    provider: "mailchimp",
    label: "Mailchimp",
    category: "communication",
    syncMode: "api",
    capabilities: ["segment subscribers", "trigger campaigns", "read campaign stats"],
    note: "Mailchimp lets the worker coordinate list segments and outreach performance.",
  },
  {
    provider: "kit",
    label: "Kit",
    category: "communication",
    syncMode: "api",
    capabilities: ["manage broadcasts", "tag subscribers", "sync automation state"],
    note: "Kit is a good fit for creator-native email sequences and purchase tagging.",
  },
  {
    provider: "gumroad",
    label: "Gumroad",
    category: "sales",
    syncMode: "webhook",
    capabilities: ["ingest purchases", "track product revenue", "read sales events"],
    note: "Gumroad is best treated as a webhook-first source for product and revenue events.",
  },
  {
    provider: "thrivecart",
    label: "ThriveCart",
    category: "sales",
    syncMode: "api",
    capabilities: ["track checkouts", "monitor upsells", "ingest rebills"],
    note: "ThriveCart provides rich funnel, order, and rebill data for the worker.",
  },
];

export function getIntegrationCatalogEntry(provider: string) {
  return integrationCatalog.find((entry) => entry.provider === provider);
}

