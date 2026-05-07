"use client";

import { useTransition } from "react";
import { Boxes, Cable, RefreshCw } from "lucide-react";
import { dashboardStore, useDashboardData } from "@/lib/dashboard-store";

async function mutateIntegration(
  provider: string,
  body: Record<string, unknown>,
  creatorId?: string,
) {
  const response = await fetch(`/api/integrations/${provider}`, {
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

export default function DashboardIntegrationsPage() {
  const data = useDashboardData();
  const [isPending, startTransition] = useTransition();

  if (!data) return null;
  const snapshot = data;

  const connected = snapshot.integrations.filter((item) => item.enabled).length;

  function update(provider: string, body: Record<string, unknown>) {
    startTransition(async () => {
      try {
        if (snapshot.creator.id === "demo-local") {
          const now = new Date();
          const integrations = snapshot.integrations.map((integration) => {
            if (integration.provider !== provider) return integration;

            if (body.action === "sync") {
              return {
                ...integration,
                enabled: true,
                status: "connected" as const,
                lastSyncedAt: now.toISOString(),
                lastSyncedLabel: "1m ago",
                metrics: [
                  { label: "Records", value: `${integration.capabilities.length * 9}` },
                  { label: "Status", value: "Ready" },
                ],
              };
            }

            const enabled = Boolean(body.enabled);
            return {
              ...integration,
              enabled,
              status: enabled ? "connected" as const : "planned" as const,
            };
          });

          const next = {
            ...snapshot,
            integrations,
            agent: {
              ...snapshot.agent,
              lastRunSummary: snapshot.agent.lastRunSummary
                ? {
                    ...snapshot.agent.lastRunSummary,
                    integrationsUsed: integrations.filter((item) => item.enabled).length,
                  }
                : snapshot.agent.lastRunSummary,
            },
          };
          dashboardStore.set(next);
          return;
        }

        const next = await mutateIntegration(provider, body, snapshot.creator.id);
        dashboardStore.set(next);
      } catch (error) {
        console.error(error);
        window.alert(error instanceof Error ? error.message : "Failed to update integration");
      }
    });
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.24em] text-[#6a5bff]">Agent inputs</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Integrations</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Connect creator data sources so the Autopilot worker can read analytics, CRM, storage, and sales signals from one place.
          </p>
        </div>

        <div className="rounded-[24px] border border-[#ece9ff] bg-white px-5 py-4 text-sm text-slate-600 shadow-[0_35px_80px_-60px_rgba(110,103,255,0.6)]">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Connected</div>
          <div className="mt-1 font-display text-3xl font-bold text-slate-900">{connected}</div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {snapshot.integrations.map((integration) => (
          <article
            key={integration.provider}
            className="rounded-[30px] border border-[#ece9ff] bg-white p-6 shadow-[0_35px_80px_-60px_rgba(110,103,255,0.6)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full bg-[#f5f2ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6a5bff]">
                  {integration.category}
                </div>
                <h2 className="text-xl font-semibold text-slate-900">{integration.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{integration.note}</p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                  integration.status === "connected"
                    ? "bg-[#effbf4] text-[#159947]"
                    : integration.status === "attention"
                      ? "bg-[#fff7e8] text-[#c17a00]"
                      : "bg-[#f3f4f6] text-slate-500"
                }`}
              >
                {integration.status}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {integration.capabilities.map((capability) => (
                <span key={capability} className="rounded-full border border-[#ece9ff] bg-[#fbfaff] px-3 py-1 text-xs text-slate-500">
                  {capability}
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {integration.metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl bg-[#fbfaff] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{metric.label}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{metric.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
              <div className="inline-flex items-center gap-2">
                <Boxes className="h-3.5 w-3.5" />
                {integration.syncMode.toUpperCase()}
              </div>
              <div>{integration.lastSyncedLabel ? `Synced ${integration.lastSyncedLabel}` : "Not synced yet"}</div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => update(integration.provider, { enabled: !integration.enabled })}
                disabled={isPending}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60 ${
                  integration.enabled
                    ? "bg-gradient-to-r from-[#8f6bff] to-[#ff4f9d] text-white"
                    : "bg-[#20222b] text-white"
                }`}
              >
                <Cable className="h-4 w-4" />
                {integration.enabled ? "Disconnect" : "Connect"}
              </button>

              <button
                onClick={() => update(integration.provider, { action: "sync" })}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-2xl bg-[#f3f0ff] px-4 py-3 text-sm font-medium text-[#6a5bff] transition hover:bg-[#ebe4ff] disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
