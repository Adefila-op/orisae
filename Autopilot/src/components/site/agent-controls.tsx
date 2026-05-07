"use client";

import { useTransition } from "react";
import { dashboardStore, DashboardSnapshot, useDashboardData } from "@/lib/dashboard-store";

function timeAgo(date: Date) {
  const deltaMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;
  return `${Math.floor(deltaHours / 24)}d ago`;
}

// eslint-disable-next-line no-unused-vars
function updateDemoSnapshot(current: DashboardSnapshot, transform: (_currentState: DashboardSnapshot) => DashboardSnapshot) {
  const next = transform(current);
  dashboardStore.set(next);
}

async function postJson(url: string, body: unknown, creatorId?: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(creatorId ? { "x-creator-id": creatorId } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

async function patchJson(url: string, body: unknown, creatorId?: string) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(creatorId ? { "x-creator-id": creatorId } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

async function getJson(url: string, creatorId?: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(creatorId ? { "x-creator-id": creatorId } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function useAgentController() {
  const data = useDashboardData();
  const [isPending, startTransition] = useTransition();
  const isDemoMode = data?.creator.id === "demo-local";
  const backendReady = Boolean(data && !isDemoMode && data.creator.id !== "unconfigured");

  function report(error: unknown) {
    console.error(error);
    if (typeof window !== "undefined") {
      window.alert(error instanceof Error ? error.message : "Agent action failed");
    }
  }

  return {
    data,
    isPending,
    backendReady,
    isDemoMode,
    canRunAgent: Boolean((backendReady || isDemoMode) && data?.agent.enabled),
    toggleAgent() {
      if (!data) return;
      if (isDemoMode) {
        updateDemoSnapshot(data, (current) => ({
          ...current,
          agent: {
            ...current.agent,
            enabled: !current.agent.enabled,
            runnableLinks: !current.agent.enabled ? current.agent.liveLinks : 0,
          },
        }));
        return;
      }
      if (!backendReady) return;
      startTransition(async () => {
        try {
          const next = await postJson("/api/agent", { enabled: !data.agent.enabled }, data.creator.id);
          dashboardStore.set(next);
        } catch (error) {
          report(error);
        }
      });
    },
    toggleLink(linkId: string, enabled: boolean) {
      if (!data) return;
      if (isDemoMode) {
        updateDemoSnapshot(data, (current) => {
          const links = current.links.map((link) => (link.id === linkId ? { ...link, enabled } : link));
          const liveLinks = links.filter((link) => link.enabled).length;
          return {
            ...current,
            links,
            agent: {
              ...current.agent,
              liveLinks,
              runnableLinks: current.agent.enabled ? liveLinks : 0,
            },
          };
        });
        return;
      }
      if (!backendReady) return;
      startTransition(async () => {
        try {
          const next = await patchJson(`/api/links/${linkId}`, { enabled }, data?.creator.id);
          dashboardStore.set(next);
        } catch (error) {
          report(error);
        }
      });
    },
    runAgent() {
      if (!data?.agent.enabled) return;
      if (isDemoMode && data) {
        updateDemoSnapshot(data, (current) => {
          const now = new Date();
          const processedLinks = current.links.filter((link) => link.enabled).length;
          const scoredUsers = current.engagement.length;
          const createdOffers = Math.max(1, Math.min(3, current.notifications.length));
          return {
            ...current,
            agent: {
              ...current.agent,
              lastRunAt: now.toISOString(),
              lastRunLabel: timeAgo(now),
              lastRunSummary: {
                processedLinks,
                scoredUsers,
                createdOffers,
                integrationsUsed: current.integrations.filter((item) => item.enabled).length,
              },
            },
          };
        });
        return;
      }
      if (!backendReady) return;
      startTransition(async () => {
        try {
          await postJson("/api/agent/run", {}, data?.creator.id);
          const next = await getJson("/api/dashboard", data?.creator.id);
          dashboardStore.set(next);
        } catch (error) {
          report(error);
        }
      });
    },
    refresh() {
      if (isDemoMode) return;
      startTransition(async () => {
        try {
          const next = await getJson("/api/dashboard", data?.creator.id);
          dashboardStore.set(next);
        } catch (error) {
          report(error);
        }
      });
    },
    async createLink(payload: { targetUrl: string; productTitle: string; offerType: string; offerValue: number }) {
      if (!data) return;
      if (isDemoMode) {
        updateDemoSnapshot(data, (current) => {
          const id = `demo-${Date.now()}`;
          const slug = `ap.link/${payload.productTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 18) || "link"}-${id.slice(-4)}`;
          const trackedUrl = `${window.location.origin}/l/${id}`;
          const links = [
            {
              id,
              name: payload.productTitle,
              trackedUrl,
              trackedSlug: slug,
              url: payload.targetUrl,
              clicks: 0,
              recovered: 0,
              revenue: 0,
              enabled: true,
              offerType: payload.offerType,
              offerValue: payload.offerValue,
              platform: "custom",
              createdAt: new Date().toISOString(),
            },
            ...current.links,
          ];
          const liveLinks = links.filter((link) => link.enabled).length;
          return {
            ...current,
            links,
            agent: {
              ...current.agent,
              liveLinks,
              runnableLinks: current.agent.enabled ? liveLinks : 0,
              totalLinks: links.length,
            },
          };
        });
        return;
      }
      if (!backendReady) return;
      try {
        const next = await postJson("/api/links", payload, data?.creator.id);
        dashboardStore.set(next);
      } catch (error) {
        report(error);
      }
    },
  };
}
