"use client";

import { useSyncExternalStore } from "react";

export type DashboardSnapshot = {
  creator: {
    id: string;
    label: string;
    walletAddress: string;
    totalSales: number;
    totalConversions: number;
  };
  agent: {
    enabled: boolean;
    liveLinks: number;
    runnableLinks: number;
    totalLinks: number;
    lastRunAt: string | null;
    lastRunLabel: string | null;
    lastRunSummary: {
      processedLinks: number;
      scoredUsers: number;
      createdOffers: number;
      integrationsUsed: number;
    } | null;
  };
  summary: {
    totalClicks: number;
    totalRecovered: number;
    totalRevenue: number;
    sentToday: number;
  };
  links: Array<{
    id: string;
    name: string;
    trackedUrl: string;
    trackedSlug: string;
    url: string;
    clicks: number;
    recovered: number;
    revenue: number;
    enabled: boolean;
    offerType: string;
    offerValue: number;
    platform: string;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    user: string;
    productName: string;
    type: string;
    status: string;
    intent: string;
    sentAt: string;
    read: boolean;
    message: string;
  }>;
  engagement: Array<{
    user: string;
    productName: string;
    visits: number;
    timeOnPage: number;
    intent: string;
    score: number;
    lastSeen: string;
    recommendedOfferType: string;
    urgencyScore: number;
    priceSensitivity: number;
  }>;
  clicksDaily: Array<{
    d: string;
    clicks: number;
    recoveries: number;
  }>;
  integrations: Array<{
    id: string;
    provider: string;
    category: string;
    label: string;
    status: "connected" | "attention" | "planned";
    enabled: boolean;
    syncMode: "api" | "mcp" | "webhook" | "manual";
    capabilities: string[];
    metrics: Array<{
      label: string;
      value: string;
    }>;
    lastSyncedAt: string | null;
    lastSyncedLabel: string | null;
    note: string;
  }>;
};

const listeners = new Set<() => void>();
let snapshot: DashboardSnapshot | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

export const dashboardStore = {
  get: () => snapshot,
  set(next: DashboardSnapshot) {
    snapshot = next;
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useDashboardData() {
  return useSyncExternalStore(dashboardStore.subscribe, dashboardStore.get, dashboardStore.get);
}
