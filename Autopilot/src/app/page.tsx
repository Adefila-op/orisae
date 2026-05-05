import Link from 'next/link'
import { ArrowRight, Bot, LayoutDashboard, PlayCircle, Sparkles, Zap } from 'lucide-react'

const highlights = [
  'Hero-first entry',
  'Agentic workflow request',
  'Fast dashboard handoff',
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,_#7b51ff_0%,_#7656ff_24%,_#8350ff_52%,_#6f63ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1480px] items-center px-4 py-6 sm:px-6 lg:px-10">
        <div className="relative w-full rounded-[2.5rem] border-[10px] border-[#242432] bg-[#f7f4fb] p-3 shadow-[0_38px_90px_rgba(25,18,55,0.32)] sm:p-5 lg:p-6">
          <div className="absolute -left-8 top-10 -z-10 hidden h-[88%] w-[96%] rounded-[2.4rem] bg-[#2a2a37] shadow-[0_35px_80px_rgba(15,10,35,0.28)] lg:block" />

          <div className="overflow-hidden rounded-[2rem] bg-white">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#7f4cff,_#d546ff)] text-white shadow-[0_14px_32px_rgba(141,85,255,0.32)]">
                  <Zap size={18} />
                </div>
                <div className="leading-tight">
                  <p className="text-lg font-semibold tracking-tight text-slate-950">Autopilot</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Agentic Usage</p>
                </div>
              </div>

              <nav className="hidden items-center gap-7 text-sm text-slate-500 lg:flex">
                <span className="font-medium text-slate-900">Landing</span>
                <span>Workflow</span>
                <span>Integration</span>
              </nav>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,_#4b86ff,_#3969ff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(66,112,255,0.3)] transition hover:brightness-110"
              >
                Dashboard
                <ArrowRight size={16} />
              </Link>
            </header>

            <section className="p-4 sm:p-6 lg:p-8">
              <div className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_28%),linear-gradient(135deg,_#4d38ff_0%,_#6e41ff_38%,_#b640ff_72%,_#d94dff_100%)] px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-12 lg:py-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(255,255,255,0.16),_transparent_22%),radial-gradient(circle_at_30%_78%,_rgba(104,157,255,0.18),_transparent_24%)]" />
                <div className="absolute -right-10 top-10 h-52 w-52 rounded-full bg-white/8 blur-2xl" />
                <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#516dff]/22 blur-3xl" />

                <div className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="max-w-[38rem]">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/92 backdrop-blur">
                      <Sparkles size={15} className="text-[#ffe37b]" />
                      Hero landing for link clicks
                    </div>

                    <h1 className="text-5xl font-semibold leading-[0.92] tracking-tight sm:text-6xl xl:text-7xl">
                      Start on the landing page,
                      <span className="block">then enter the dashboard.</span>
                    </h1>

                    <p className="mt-6 max-w-xl text-base leading-7 text-white/82 sm:text-lg">
                      When users click your link, they should land on a clean hero first. From there, one strong action
                      lets them request agentic usage by opening the dashboard.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                      {highlights.map((item) => (
                        <div
                          key={item}
                          className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur"
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className="mt-9 flex flex-wrap items-center gap-4">
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-base font-semibold text-slate-950 shadow-[0_18px_36px_rgba(18,18,38,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(18,18,38,0.24)]"
                      >
                        Request Agentic Usage
                        <LayoutDashboard size={18} />
                      </Link>

                      <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-4 text-sm font-medium text-white/90 backdrop-blur">
                        <PlayCircle size={17} />
                        Dashboard access starts here
                      </div>
                    </div>

                    <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/72">
                      <div className="flex items-center gap-2">
                        <Bot size={16} />
                        Agent-ready entry flow
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} />
                        One-click dashboard path
                      </div>
                    </div>
                  </div>

                  <div className="relative mx-auto flex w-full max-w-[28rem] items-center justify-center">
                    <div className="absolute left-2 top-12 hidden h-[22rem] w-[11rem] rotate-[-18deg] rounded-[2rem] border-[5px] border-[#252535] bg-[linear-gradient(180deg,_#8451ff,_#d34dff)] shadow-[0_25px_50px_rgba(23,18,53,0.32)] lg:block">
                      <div className="mx-auto mt-3 h-4 w-20 rounded-full bg-black/45" />
                      <div className="flex h-full items-center justify-center pb-10 text-white/90">
                        <div className="rounded-3xl bg-white/14 p-5 backdrop-blur">
                          <Zap size={42} />
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 w-[15.5rem] rotate-[16deg] rounded-[2.2rem] border-[6px] border-[#252535] bg-white p-3 shadow-[0_30px_60px_rgba(26,18,58,0.34)] sm:w-[17rem]">
                      <div className="mx-auto mb-3 h-4 w-24 rounded-full bg-slate-900" />
                      <div className="space-y-3 rounded-[1.6rem] bg-slate-50 p-3">
                        <div className="rounded-[1.25rem] bg-white p-3 shadow-sm">
                          <div className="mb-3 h-28 rounded-[1rem] bg-[linear-gradient(135deg,_#f4f1ff,_#e7e3ff)]" />
                          <div className="space-y-2">
                            <div className="h-3 w-3/4 rounded-full bg-slate-200" />
                            <div className="h-3 w-1/2 rounded-full bg-slate-100" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-[1rem] bg-white p-3 shadow-sm">
                            <div className="h-14 rounded-xl bg-[linear-gradient(135deg,_#f7e4ff,_#ebd5ff)]" />
                            <div className="mt-2 h-2 w-10 rounded-full bg-slate-200" />
                          </div>
                          <div className="rounded-[1rem] bg-white p-3 shadow-sm">
                            <div className="h-14 rounded-xl bg-[linear-gradient(135deg,_#e4eeff,_#d7e5ff)]" />
                            <div className="mt-2 h-2 w-12 rounded-full bg-slate-200" />
                          </div>
                        </div>
                        <div className="rounded-[1rem] bg-[linear-gradient(135deg,_#4b86ff,_#3868ff)] px-4 py-3 text-center text-sm font-semibold text-white">
                          Open dashboard
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
