"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Cable,
  LayoutDashboard,
  Link2,
  Plus,
  Power,
  Search,
  Settings2,
  Zap,
} from "lucide-react";
import { useAgentController } from "@/components/site/agent-controls";

const navItems = [
  { href: "/dashboard", label: "Recovery Board", icon: LayoutDashboard },
  { href: "/dashboard/links", label: "Links", icon: Link2 },
  { href: "/dashboard/engagement", label: "Signals", icon: Activity },
  { href: "/dashboard/integrations", label: "Integrations", icon: Cable },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, toggleAgent, isPending, backendReady, isDemoMode } = useAgentController();
  const enabled = data?.agent.enabled ?? false;

  return (
    <div className="min-h-screen w-full bg-[#17181d] text-white">
      <div className="flex min-h-screen w-full overflow-hidden bg-[#17181d]">
        <aside className="hidden w-[72px] flex-col justify-between border-r border-white/5 bg-[#1d1e24] py-5 md:flex">
          <div>
            <div className="flex justify-center">
              <Link
                href="/dashboard"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2f95ff] to-[#4460ff] shadow-[0_18px_40px_-18px_rgba(47,149,255,0.75)]"
              >
                <Zap className="h-5 w-5 text-white" />
              </Link>
            </div>
            <div className="mt-10 flex flex-col items-center gap-5">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
                      active
                        ? "bg-[#252833] text-[#4ca2ff]"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-white/5 px-4 py-4 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="hidden items-center gap-7 text-sm text-white/44 md:flex">
                  <Link href="/dashboard" className="font-medium text-white">Overview</Link>
                  <Link href="/dashboard/engagement" className="hover:text-white/85">Signals</Link>
                  <Link href="/dashboard/notifications" className="hover:text-white/85">Notifications</Link>
                </div>
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-center">
                <div className="hidden w-full max-w-[380px] items-center gap-3 rounded-2xl bg-[#1f2128] px-4 py-3 text-sm text-white/55 md:flex">
                  <Search className="h-4 w-4 text-[#358cff]" />
                  <span>Active links, offers, creators...</span>
                  <div className="ml-auto text-white/35">
                    <Settings2 className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <Link
                  href="/dashboard/notifications"
                  className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-[#1f2128] text-white/70 md:flex"
                >
                  <Bell className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/links"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#2d8cff] to-[#4f74ff] px-4 py-3 text-sm font-medium text-white shadow-[0_20px_40px_-20px_rgba(70,116,255,0.9)]"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">Add Link</span>
                </Link>
                <div className="hidden items-center gap-3 rounded-2xl bg-[#1f2128] px-3 py-2.5 md:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ffb35b] to-[#ff5d8f] text-[11px] font-semibold text-white">
                    {data?.creator.label?.slice(0, 2).toUpperCase() || "AU"}
                  </div>
                  <div className="text-sm text-white/80">
                    Hey, <span className="font-semibold text-white">{data?.creator.label || "Creator"}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <nav className="hidden w-[230px] border-r border-white/5 bg-[#191b21] px-4 py-6 md:block">
              <div className="mb-10">
                <div className="text-[11px] uppercase tracking-[0.26em] text-white/28">Workspace</div>
                <div className="mt-3 text-sm text-white/52">
                  Department: <span className="font-medium text-[#ffb45a]">Recovery Agents</span>
                </div>
              </div>

              <div className="space-y-2">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
                        active
                          ? "bg-[#242732] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                          : "text-white/52 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${active ? "text-[#3f91ff]" : "text-white/45"}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 rounded-[26px] bg-[#20222b] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Power className={`h-4 w-4 ${enabled ? "text-[#2aa5ff]" : "text-white/35"}`} />
                    <span className="text-sm font-medium text-white">Agent Core</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-[0.24em] ${enabled ? "text-[#2aa5ff]" : "text-white/30"}`}>
                    {enabled ? "Live" : "Idle"}
                  </span>
                </div>
                <p className="text-xs leading-6 text-white/45">
                  Global control for link automation, intent evaluation, and recovery follow-up.
                </p>
                <p className="mt-3 text-xs leading-6 text-white/35">
                  {data?.agent.lastRunLabel
                    ? `Last run ${data.agent.lastRunLabel}. ${data.agent.lastRunSummary?.scoredUsers ?? 0} visitors scored.`
                    : "No agent cycle has been recorded yet."}
                </p>
                <button
                  onClick={toggleAgent}
                  disabled={isPending || (!backendReady && !isDemoMode)}
                  className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-60 ${
                    enabled
                      ? "bg-gradient-to-r from-[#2d8cff] to-[#4f74ff] text-white"
                      : "bg-[#2a2d37] text-white/75 hover:bg-[#343845]"
                  }`}
                >
                  {isPending ? "Updating..." : enabled ? "Pause agent" : "Activate agent"}
                </button>
                {isDemoMode ? (
                  <p className="mt-3 text-xs leading-6 text-[#9cc6ff]">
                    Running in local demo mode because PostgreSQL or the local API is offline. Buttons still work in-browser.
                  </p>
                ) : !backendReady ? (
                  <p className="mt-3 text-xs leading-6 text-[#ffb45a]">
                    Backend is offline in production. Add `DATABASE_URL`, `CRON_SECRET`, and `RESEND_API_KEY` in Vercel envs.
                  </p>
                ) : null}
              </div>
            </nav>

            <main className="min-w-0 flex-1 bg-[#17181d]">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
