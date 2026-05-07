"use client";

import { useState } from "react";
import { Bell, Check, Eye, MousePointerClick, X } from "lucide-react";
import { useDashboardData } from "@/lib/dashboard-store";

const statusMeta = {
  sent: { color: "border-[#ebeafe] bg-white text-slate-400", icon: Bell, label: "Sent" },
  opened: { color: "border-[#d9d2ff] bg-[#f5f2ff] text-[#6a5bff]", icon: Eye, label: "Opened" },
  clicked: { color: "border-[#d9d2ff] bg-[#f5f2ff] text-[#6a5bff]", icon: MousePointerClick, label: "Clicked" },
  converted: { color: "border-[#ffd8ec] bg-[#fff5fb] text-[#ff4f9d]", icon: Check, label: "Converted" },
  ignored: { color: "border-destructive/30 bg-destructive/10 text-destructive", icon: X, label: "Ignored" },
} as const;

const filters = ["all", "converted", "clicked", "opened", "sent", "ignored"] as const;

export default function DashboardNotificationsPage() {
  const data = useDashboardData();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  if (!data) return null;

  const filtered = filter === "all" ? data.notifications : data.notifications.filter((item) => item.status === filter);
  const counts = {
    sent: data.notifications.length,
    converted: data.notifications.filter((item) => item.status === "converted").length,
    ctr: Math.round(
      (data.notifications.filter((item) => ["clicked", "converted"].includes(item.status)).length / Math.max(1, data.notifications.length)) * 100,
    ),
  };

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-8">
        <div className="mb-1 text-xs uppercase tracking-[0.24em] text-[#6a5bff]">Offer engine</div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Notifications</h1>
        <p className="mt-2 text-sm text-slate-500">A live feed of every follow-up the agent has sent on the creator&apos;s behalf.</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Stat label="Total sent" value={counts.sent} />
        <Stat label="Converted" value={counts.converted} accent="success" />
        <Stat label="Click-through" value={`${counts.ctr}%`} accent="primary" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
              filter === item
                ? "border-[#d8d0ff] bg-[#f3f0ff] text-slate-900"
                : "border-[#ebeafe] text-slate-500 hover:text-slate-900"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[32px] border border-[#ece9ff] bg-white shadow-[0_35px_80px_-60px_rgba(110,103,255,0.6)]">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No notifications match this filter.</div>
        ) : (
          filtered.map((item) => {
            const meta = statusMeta[item.status as keyof typeof statusMeta];
            const Icon = meta.icon;

            return (
              <div key={item.id} className="flex items-center gap-4 border-b border-[#f3f0ff] px-5 py-4 transition-colors last:border-0 hover:bg-[#fcfbff]">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-slate-900">
                    <span className="font-medium capitalize">{item.type}</span>
                    <span className="text-slate-400">{" offer - "}{item.productName}</span>
                  </div>
                  <div className="truncate font-mono text-xs text-slate-400">{item.user}</div>
                </div>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-slate-400">intent: {item.intent}</span>
                </div>
                <div className="hidden w-32 text-right font-mono text-xs text-slate-400 md:block">{item.sentAt}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "success" | "primary";
}) {
  return (
    <div className="rounded-[28px] border border-[#ece9ff] bg-white p-5 shadow-[0_35px_80px_-60px_rgba(110,103,255,0.6)]">
      <div className="mb-2 text-xs text-slate-400">{label}</div>
      <div className={`font-display text-3xl font-bold ${accent === "success" ? "text-[#ff4f9d]" : accent === "primary" ? "text-[#6a5bff]" : "text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}
