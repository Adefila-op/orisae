import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  LayoutDashboard,
  Link2,
  Play,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

function PhoneMock() {
  const rows = [
    { title: "Discount trigger", sub: "High intent - Creator course" },
    { title: "Bundle follow-up", sub: "Warm lead - Design pack" },
    { title: "Recovered sale", sub: "Offer accepted - $129" },
  ];

  return (
    <div className="relative mx-auto w-[270px] rounded-[40px] border border-white/70 bg-white p-4 shadow-[0_50px_120px_-50px_rgba(91,82,235,0.5)]">
      <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-100" />
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="text-[11px] text-slate-400">Today</div>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Agent releases</h3>
        </div>
        <div className="rounded-full bg-[#f4f0ff] px-2.5 py-1 text-[11px] font-medium text-[#6a5bff]">
          Live
        </div>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.title} className="flex items-center gap-3 rounded-3xl bg-[#fbfaff] p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8f6bff] to-[#4d7dff] text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{row.title}</div>
              <div className="truncate text-xs text-slate-400">{row.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-400">
        <span>Links</span>
        <span>Offers</span>
        <span>Revenue</span>
      </div>
    </div>
  );
}

function Blob({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={`absolute rounded-[42%] bg-gradient-to-br from-[#9a83ff] to-[#5a73ff] opacity-95 ${className}`}
    />
  );
}

function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/40 bg-white/15 text-white backdrop-blur-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold text-white">Autopilot</div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-white/60">by Popup</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/80 md:flex">
          <a href="#overview" className="transition-colors hover:text-white">Overview</a>
          <a href="#metrics" className="transition-colors hover:text-white">Metrics</a>
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#dashboard" className="transition-colors hover:text-white">Dashboard</a>
        </nav>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#6a5bff] shadow-[0_18px_40px_-18px_rgba(255,255,255,0.9)]"
        >
          Open agent
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="overview"
      className="relative overflow-hidden bg-gradient-to-br from-[#8a6cff] via-[#6d7cff] to-[#5d94ff] pb-28 pt-36 text-white"
    >
      <Blob className="-left-24 top-24 h-64 w-64 blur-[2px]" />
      <Blob className="right-8 top-20 h-80 w-80 opacity-35" />
      <div className="absolute inset-x-0 bottom-0 h-24 rounded-t-[42%] bg-white" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/85 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Actual agent visibility for creator funnels
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl">
            Landing page for your recovery agent.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/78">
            Autopilot turns tracked clicks into real follow-up decisions, live offer activity, and
            a dashboard creators can actually operate.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#685bff] shadow-[0_30px_60px_-24px_rgba(255,255,255,0.9)]"
            >
              Launch dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm"
            >
              <Play className="h-4 w-4" /> See the live flow
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 top-20 z-0 h-48 w-48 rounded-[34%] bg-white/14 blur-sm" />
          <div className="absolute right-0 top-0 z-0 h-64 w-64 rounded-[38%] bg-[#92a2ff]/30" />
          <div className="relative z-10">
            <PhoneMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metrics() {
  const items = [
    { value: "14M+", label: "tracked clicks", icon: Link2 },
    { value: "1.35M+", label: "offer interactions", icon: Bell },
    { value: "0.35M+", label: "high-intent users", icon: TrendingUp },
    { value: "1.43M+", label: "creator actions saved", icon: LayoutDashboard },
  ];

  return (
    <section id="metrics" className="relative overflow-hidden bg-white py-24">
      <Blob className="-left-16 top-10 h-80 w-80 opacity-18" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-[30px] border border-[#f0edff] bg-white p-6 shadow-[0_30px_90px_-50px_rgba(112,102,255,0.35)]"
            >
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5f2ff] text-[#6a5bff]">
                <item.icon className="h-4 w-4" />
              </div>
              <div className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">{item.value}</div>
              <div className="mt-2 text-sm text-slate-400">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="max-w-xl">
          <div className="mb-4 inline-flex rounded-full bg-[#f4f0ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#6a5bff]">
            Why it works
          </div>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-[-0.04em] text-slate-900 sm:text-5xl">
            Users love products that actually show the funnel.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-500">
            The new UI is lighter, more product-led, and clearer about what the agent is doing.
            Instead of decorative dashboards, the experience now points directly at link volume,
            intent, offers, and recovered revenue.
          </p>
        </div>
      </div>
    </section>
  );
}

function FeatureShowcase() {
  const sections = [
    {
      title: "Best for operating recovery without digging through tools",
      copy:
        "Creators can see which links are live, which visitors are warming up, and what the system is sending on their behalf.",
      align: "left",
    },
    {
      title: "Collaborate with the actual agent, not just a static dashboard",
      copy:
        "The console now sits on top of real data routes so every toggle, link state, and notification list reflects the live database.",
      align: "right",
    },
  ] as const;

  return (
    <section id="features" className="bg-white py-8">
      <div className="mx-auto max-w-7xl space-y-24 px-6">
        {sections.map((section, index) => (
          <div
            key={section.title}
            className={`grid gap-14 lg:grid-cols-2 lg:items-center ${
              section.align === "right" ? "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1" : ""
            }`}
          >
            <div className="max-w-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f0ff] text-[#6a5bff]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="font-display text-4xl font-semibold leading-tight tracking-[-0.04em] text-slate-900">
                {section.title}
              </h3>
              <p className="mt-5 text-base leading-8 text-slate-500">{section.copy}</p>
              <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center rounded-full bg-gradient-to-r from-[#8f6bff] to-[#ff4f9d] px-5 py-3 text-sm font-semibold text-white shadow-[0_24px_50px_-24px_rgba(173,92,255,0.8)]"
              >
                Explore dashboard
              </Link>
            </div>

            <div className="relative flex justify-center">
              <Blob className={`h-[310px] w-[310px] ${index === 0 ? "rotate-[24deg]" : "-rotate-[12deg]"} opacity-95`} />
              <div className={`relative z-10 ${index === 0 ? "rotate-[18deg]" : "rotate-0"}`}>
                <PhoneMock />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardStrip() {
  const bullets = [
    "Real smart_links state from Postgres",
    "Actual intent scores and notification feed",
    "Global and per-link agent toggles",
    "Create new tracked links from the dashboard",
  ];

  return (
    <section id="dashboard" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="overflow-hidden rounded-[42px] bg-gradient-to-br from-[#f7f5ff] via-white to-[#eff4ff] px-8 py-10 shadow-[0_50px_120px_-70px_rgba(90,105,255,0.45)] md:px-12 md:py-14">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#6a5bff] shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Dashboard upgrade
              </div>
              <h2 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-5xl">
                The agent dashboard now works with the actual backend.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-500">
                No more mock cards pretending to be live. The overview, engagement, links, and
                notifications screens now read from the real database shape already defined in the project.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-3xl bg-white px-4 py-4 text-sm text-slate-700 shadow-[0_20px_60px_-44px_rgba(100,95,255,0.55)]"
                  >
                    {bullet}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex justify-center">
              <PhoneMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-[#efebff] pt-8 text-sm text-slate-400 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8f6bff] to-[#4d7dff] text-white">
            <Zap className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-semibold text-slate-900">Autopilot</span>
        </div>
        <div>Built for creator recovery flows on May 5, 2026.</div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="bg-white">
      <Nav />
      <Hero />
      <Metrics />
      <FeatureShowcase />
      <DashboardStrip />
      <Footer />
    </div>
  );
}
