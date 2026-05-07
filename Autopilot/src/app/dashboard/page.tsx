"use client";

import Link from "next/link";
import {
  Bot,
  CalendarRange,
  Filter,
  Link2,
  RefreshCw,
} from "lucide-react";
import { useAgentController } from "@/components/site/agent-controls";
import { useDashboardData } from "@/lib/dashboard-store";

type BoardCard = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  tags: string[];
  accent: string;
  metricA: string;
  metricB: string;
  metricC?: string;
};

export default function DashboardOverviewPage() {
  const data = useDashboardData();
  const { runAgent, refresh, isPending, backendReady, canRunAgent, isDemoMode } = useAgentController();
  if (!data) return null;

  const backlogCards: BoardCard[] = data.links
    .filter((item) => item.recovered === 0 || !item.enabled)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: item.platform.toUpperCase(),
      body: "Tracked product link waiting for stronger buyer intent before the agent escalates.",
      tags: [item.offerType, "Watchlist", item.enabled ? "Live" : "Paused"],
      accent: "from-[#ff6b8f] to-[#ffae59]",
      metricA: `${item.clicks} clicks`,
      metricB: `${item.revenue.toLocaleString()} value`,
      metricC: item.trackedSlug,
    }));

  const inProgressCards: BoardCard[] = data.engagement.slice(0, 3).map((item, index) => ({
    id: `${item.user}-${index}`,
    title: item.productName,
    subtitle: `${item.intent} intent`,
    body: `Purchase probability is ${item.score}%. The agent is evaluating ${item.recommendedOfferType} follow-up timing now.`,
    tags: [item.intent, "Scored", item.recommendedOfferType],
    accent: "from-[#2f95ff] to-[#7065ff]",
    metricA: `${item.visits} visits`,
    metricB: `${item.lastSeen}`,
    metricC: `${item.timeOnPage}s engaged`,
  }));

  const completedCards: BoardCard[] = data.notifications
    .filter((item) => item.status === "converted" || item.status === "clicked")
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      title: item.productName,
      subtitle: item.type,
      body: item.message || "The recovery sequence reached the user and generated a positive outcome for the funnel.",
      tags: [item.status, item.intent, "Recovered"],
      accent: "from-[#23d26b] to-[#2f95ff]",
      metricA: item.sentAt,
      metricB: item.user,
      metricC: "1 file",
    }));

  const avatarSeeds = [
    "from-[#ff9a5a] to-[#ff5d8f]",
    "from-[#8f6bff] to-[#4f74ff]",
    "from-[#38d8a6] to-[#2f95ff]",
    "from-[#ffc15d] to-[#ff7f5d]",
    "from-[#ff6ba2] to-[#c44dff]",
  ];

  const boardColumns = [
    { key: "backlog", title: "Backlog", dot: "bg-white/55", cards: backlogCards },
    { key: "progress", title: "In Progress", dot: "bg-[#2f95ff]", cards: inProgressCards },
    { key: "done", title: "Completed", dot: "bg-[#1ec85f]", cards: completedCards },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-[30px] bg-[#17181d] px-3 py-3 md:px-5 md:py-4">
        <div className="text-[11px] text-white/35">
          Department: <span className="font-medium text-[#ffb45a]">Creator Recovery Ops</span>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
              Active Tasks
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/42">
              Exact board layout, but mapped to Autopilot: queued links on the left, live agent work
              in the middle, and recovered outcomes on the right.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill icon={Filter} label={`${data.agent.runnableLinks} active links`} />
            <StatusPill
              icon={CalendarRange}
              label={data.agent.lastRunLabel ? `Last run ${data.agent.lastRunLabel}` : "No run recorded yet"}
            />
            <StatusPill
              icon={Bot}
              label={`${data.integrations.filter((item) => item.enabled).length} agent data sources`}
            />
            <div className="ml-2 flex -space-x-2">
              {avatarSeeds.slice(0, Math.max(1, Math.min(data.agent.liveLinks, avatarSeeds.length))).map((seed, index) => (
                <div
                  key={index}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#17181d] bg-gradient-to-br text-[11px] font-semibold text-white ${seed}`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-white/35">
            <button
              onClick={refresh}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#20222b] px-4 py-3 text-white/70 transition-colors hover:text-white disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link
              href="/dashboard/links"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#20222b] px-4 py-3 text-white/70 transition-colors hover:text-white"
            >
              <Link2 className="h-4 w-4" />
              Manage links
            </Link>
            <button
              onClick={runAgent}
              disabled={isPending || !canRunAgent}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#2d8cff] to-[#4f74ff] px-4 py-3 text-white disabled:opacity-60"
            >
              <Bot className="h-4 w-4" />
              {isPending ? "Running..." : "Run Agent"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {boardColumns.map((column) => (
            <section key={column.key} className="rounded-[28px] bg-[#1f2128] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
              <div className="mb-4 flex items-center px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                  <h2 className="text-lg font-medium text-white">{column.title}</h2>
                </div>
              </div>

              <div className="space-y-4">
                {column.cards.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-white/8 bg-[#252833] p-6 text-sm leading-7 text-white/38">
                    Nothing is here yet. Connect production `DATABASE_URL` to Vercel to replace this
                    fallback board with live agent work.
                  </div>
                ) : (
                  column.cards.map((card, index) => (
                    <BoardCardView key={card.id} card={card} elevated={column.key === "backlog" && index === 0} />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
        {isDemoMode ? (
          <div className="mt-5 rounded-[24px] border border-[#4f93ff]/20 bg-[#182434] px-5 py-4 text-sm text-[#9cc6ff]">
            PostgreSQL or the local API is offline, so this workspace is running in local demo mode. Agent and button flows stay interactive in-browser.
          </div>
        ) : !backendReady ? (
          <div className="mt-5 rounded-[24px] border border-[#ffb45a]/20 bg-[#2a2316] px-5 py-4 text-sm text-[#ffcf93]">
            Agent actions are disabled because the production backend is missing Vercel environment variables.
            Add `DATABASE_URL`, `CRON_SECRET`, `RESEND_API_KEY`, and `FROM_EMAIL` to make the live agent run.
          </div>
        ) : !data.agent.enabled ? (
          <div className="mt-5 rounded-[24px] border border-[#4f93ff]/20 bg-[#182434] px-5 py-4 text-sm text-[#9cc6ff]">
            Agent Core is paused globally. Link state is preserved, but scoring and follow-up stay idle until you reactivate it.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-[#20222b] px-4 py-3 text-sm text-white/60">
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}

function BoardCardView({
  card,
  elevated = false,
}: {
  card: BoardCard;
  elevated?: boolean;
}) {
  return (
    <article
      className={`rounded-[26px] bg-[#2a2d37] p-5 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.8)] ${
        elevated ? "-rotate-[5deg]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[18px] font-medium tracking-[-0.03em] text-white">{card.title}</h3>
          <p className="mt-1 text-xs text-[#4f93ff]">{card.subtitle}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {card.tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full bg-gradient-to-r px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white shadow-[0_10px_25px_-18px_rgba(255,255,255,0.4)] ${card.accent}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm leading-7 text-white/48">{card.body}</p>

      <div className="mt-5 rounded-[22px] bg-[#20222b] p-4">
        <div className="mb-3 h-36 rounded-[18px] bg-gradient-to-br from-[#14161d] via-[#242935] to-[#313747] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="flex h-full items-end justify-between p-4">
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/28">Autopilot</div>
              <div className="text-4xl font-semibold tracking-[-0.04em] text-white">{card.metricA.split(" ")[0]}</div>
            </div>
            <div className="space-y-1 text-right text-sm text-white/38">
              <div>{card.metricB}</div>
              {card.metricC ? <div>{card.metricC}</div> : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-white/42">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1ec85f]" />
            {card.metricA}
          </div>
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[#4f93ff]" />
            {card.metricB}
          </div>
        </div>
      </div>
    </article>
  );
}
