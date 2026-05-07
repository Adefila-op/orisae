"use client";

import { useDashboardData } from "@/lib/dashboard-store";

const intentColor = {
  high: "border-[#ffd8ec] bg-[#fff5fb] text-[#ff4f9d]",
  medium: "border-[#d9d2ff] bg-[#f5f2ff] text-[#6a5bff]",
  low: "border-[#ebeafe] bg-white text-slate-500",
} as const;

export default function DashboardEngagementPage() {
  const data = useDashboardData();
  if (!data) return null;

  const buckets = {
    high: data.engagement.filter((item) => item.intent === "high").length,
    medium: data.engagement.filter((item) => item.intent === "medium").length,
    low: data.engagement.filter((item) => item.intent === "low").length,
  };

  const total = Math.max(1, data.engagement.length);

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-8">
        <div className="mb-1 text-xs uppercase tracking-[0.24em] text-[#6a5bff]">Intent engine</div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Engagement</h1>
        <p className="mt-2 text-sm text-slate-500">Live visitor intent signals from `intent_scores`.</p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {(["high", "medium", "low"] as const).map((key) => (
          <div key={key} className="rounded-[28px] border border-[#ece9ff] bg-white p-5 shadow-[0_35px_80px_-60px_rgba(110,103,255,0.6)]">
            <div className="mb-3 flex items-center justify-between">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${intentColor[key]}`}>
                {key} intent
              </span>
            </div>
            <div className="font-display text-3xl font-bold text-slate-900">{buckets[key]}</div>
            <div className="mt-1 text-xs text-slate-400">
              {Math.round((buckets[key] / total) * 100)}% of active visitors
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f1efff]">
              <div
                className={`h-full rounded-full ${key === "high" ? "bg-[#ff4f9d]" : key === "medium" ? "bg-[#6a5bff]" : "bg-slate-300"}`}
                style={{ width: `${(buckets[key] / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[32px] border border-[#ece9ff] bg-white shadow-[0_35px_80px_-60px_rgba(110,103,255,0.6)]">
        <div className="grid grid-cols-12 border-b border-[#f0edff] bg-[#fbfaff] px-5 py-3 text-[10px] uppercase tracking-wider text-slate-400">
          <div className="col-span-3">Visitor</div>
          <div className="col-span-3">Product</div>
          <div className="col-span-1 text-right">Visits</div>
          <div className="col-span-2 text-right">Time</div>
          <div className="col-span-1 text-right">Score</div>
          <div className="col-span-2 text-right">Last seen</div>
        </div>
        {data.engagement.map((item) => {
          const intentKey =
            item.intent === "high" || item.intent === "medium" || item.intent === "low"
              ? item.intent
              : "low";
          return (
            <div key={`${item.user}-${item.productName}`} className="grid grid-cols-12 items-center border-b border-[#f3f0ff] px-5 py-4 text-sm last:border-0">
              <div className="col-span-3 truncate font-mono text-xs">{item.user}</div>
              <div className="col-span-3 truncate text-slate-500">{item.productName}</div>
              <div className="col-span-1 text-right">{item.visits}</div>
              <div className="col-span-2 text-right text-slate-400">
                {Math.floor(item.timeOnPage / 60)}m {item.timeOnPage % 60}s
              </div>
              <div className="col-span-1 text-right">
                <span className={`inline-block min-w-[2.5rem] rounded-full border px-2 py-0.5 text-center text-xs font-medium ${intentColor[intentKey]}`}>
                  {item.score}
                </span>
              </div>
              <div className="col-span-2 text-right text-xs text-slate-400">{item.lastSeen}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
