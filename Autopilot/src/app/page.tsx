import Link from 'next/link'
import { ArrowRight, Bot, LayoutDashboard, Sparkles, Zap } from 'lucide-react'

const quickSignals = [
  'Agentic task routing',
  'Live recovery workflows',
  'Smart dashboard handoff',
]

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_28%),linear-gradient(135deg,_#5a39ff_0%,_#7b43ff_28%,_#d345ff_62%,_#7d54ff_100%)] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(16,18,31,0.12),_rgba(10,10,18,0.28))]" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-white/18 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#3c6dff]/25 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-black/10 bg-white/95 px-5 py-4 text-slate-900 shadow-[0_20px_60px_rgba(20,18,40,0.18)] backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#6b4dff,_#d345ff)] text-white shadow-[0_14px_30px_rgba(120,76,255,0.35)]">
                <Zap size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">Autopilot</p>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Agentic Usage Flow</p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,_#4a84ff,_#3167ff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(50,102,255,0.35)] transition hover:brightness-110"
            >
              Open Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        <section className="flex flex-1 items-center py-10 lg:py-14">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
                <Sparkles size={15} className="text-[#ffd36f]" />
                Agentic landing flow
              </div>

              <h1 className="text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Open the landing page,
                <span className="block text-white/85">then move straight into the dashboard.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/78 sm:text-lg">
                This hero is built for agentic usage. When a user clicks your link, they land here first,
                understand the value instantly, and then continue into the dashboard with one clear action.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {quickSignals.map((item) => (
                  <div
                    key={item}
                    className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-base font-semibold text-slate-900 shadow-[0_20px_40px_rgba(15,18,35,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(15,18,35,0.28)]"
                >
                  Request Agentic Usage
                  <LayoutDashboard size={18} />
                </Link>

                <p className="text-sm text-white/70">
                  Prefer the faster path?
                  <Link href="/dashboard" className="ml-2 font-semibold text-white underline decoration-white/35 underline-offset-4">
                    Go to dashboard
                  </Link>
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="mx-auto max-w-[38rem] rounded-[2.25rem] border border-black/12 bg-white/95 p-4 shadow-[0_30px_80px_rgba(18,15,40,0.26)] backdrop-blur md:p-5">
                <div className="overflow-hidden rounded-[1.9rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_26%),linear-gradient(135deg,_#4f3cff_0%,_#7a40ff_42%,_#db47ff_100%)] p-6 md:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.26em] text-white/60">Hero Preview</p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                        Make agentic entry feel instant.
                      </h2>
                    </div>
                    <div className="hidden rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm text-white/85 md:block">
                      Hero only
                    </div>
                  </div>

                  <p className="mt-5 max-w-md text-sm leading-6 text-white/78 md:text-base">
                    Keep the landing experience simple, visual, and confident. One headline, one CTA, one clear route into the dashboard.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.6rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/16 text-white">
                        <Bot size={22} />
                      </div>
                      <p className="text-lg font-semibold text-white">Agent-ready intro</p>
                      <p className="mt-2 text-sm leading-6 text-white/72">
                        Users arrive on a polished hero before entering the operational workspace.
                      </p>
                    </div>

                    <div className="rounded-[1.6rem] border border-white/14 bg-[#111322]/22 p-5 backdrop-blur">
                      <div className="mb-4 h-28 rounded-[1.4rem] bg-[linear-gradient(145deg,_rgba(255,255,255,0.18),_rgba(255,255,255,0.03))] p-4">
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>Dashboard CTA</span>
                          <span>Live</span>
                        </div>
                        <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900">
                          Request Agentic Usage
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-white/72">
                        The primary action stays obvious, visible, and low-friction on both desktop and mobile.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
