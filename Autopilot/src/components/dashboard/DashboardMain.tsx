'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  Copy,
  ExternalLink,
  LayoutGrid,
  List,
  Menu,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { analyticsAPI, linksAPI } from '@/lib/api-client'
import CreateLinkModal from './CreateLinkModal'
import LinksList from './LinksList'
import NotificationPanel from './NotificationPanel'

interface DashboardMainProps {
  onToggleSidebar: () => void
}

interface DashboardStats {
  totalLinks: number
  activeLinks: number
  totalClicks: number
  totalConversions: number
  totalValue: number
  conversionRate: string
}

interface DashboardLink {
  id: string
  code: string
  target_url: string
  offer_type: string
  offer_value: number
  click_count: number
  conversion_count: number
  total_value: number
  enabled: boolean
  platform?: string
}

interface DailyAnalyticsPoint {
  date: string
  total_clicks: number
  total_conversions: number
  total_value: number | string
}

interface PlatformStat {
  platform: string
  platform_name: string
  platform_icon: string
  link_count: number
  total_clicks: number
  total_conversions: number
  total_value: number | string
  avg_conversion_rate: number
}

interface DashboardResponse {
  summary: DashboardStats & {
    totalValue: number | string
  }
  links: DashboardLink[]
  dailyAnalytics: DailyAnalyticsPoint[]
}

type FilterMode = 'all' | 'active' | 'paused' | 'converted'
type ViewMode = 'board' | 'list'

const laneConfig = [
  {
    key: 'backlog',
    title: 'Backlog',
    accent: 'bg-white/70',
    description: 'Fresh or paused smart links waiting for momentum.',
  },
  {
    key: 'progress',
    title: 'In Progress',
    accent: 'bg-sky-400',
    description: 'Links that are getting attention and need tuning.',
  },
  {
    key: 'completed',
    title: 'Completed',
    accent: 'bg-emerald-400',
    description: 'Links already converting into revenue.',
  },
] as const

const teams = [
  { name: 'Caven', tint: 'from-pink-400 to-orange-400' },
  { name: 'Maya', tint: 'from-sky-400 to-indigo-500' },
  { name: 'Theo', tint: 'from-emerald-400 to-teal-500' },
  { name: 'Rin', tint: 'from-violet-400 to-fuchsia-500' },
]

export default function DashboardMain({ onToggleSidebar }: DashboardMainProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [links, setLinks] = useState<DashboardLink[]>([])
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalyticsPoint[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([])
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [query, setQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()

    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      const [dashboardData, platformData] = await Promise.all([
        analyticsAPI.dashboard() as Promise<DashboardResponse>,
        linksAPI.platformStats() as Promise<{ stats: PlatformStat[] }>,
      ])

      setStats({
        totalLinks: dashboardData.summary.totalLinks || 0,
        activeLinks: dashboardData.summary.activeLinks || 0,
        totalClicks: dashboardData.summary.totalClicks || 0,
        totalConversions: dashboardData.summary.totalConversions || 0,
        totalValue: parseFloat(String(dashboardData.summary.totalValue)) || 0,
        conversionRate: dashboardData.summary.conversionRate || '0',
      })

      setLinks(dashboardData.links || [])
      setDailyAnalytics((dashboardData.dailyAnalytics || []).slice().reverse())
      setPlatformStats(platformData.stats || [])
      setSelectedLinkId((current) => {
        if (current && dashboardData.links.some((link) => link.id === current)) {
          return current
        }

        return pickPreferredLink(dashboardData.links)?.id || null
      })
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      setStats({
        totalLinks: 0,
        activeLinks: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalValue: 0,
        conversionRate: '0',
      })
      setLinks([])
      setDailyAnalytics([])
      setPlatformStats([])
      setSelectedLinkId(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  async function handleToggle(linkId: string, enabled: boolean) {
    try {
      await linksAPI.toggle(linkId, enabled)
      await fetchDashboardData()
    } catch (error) {
      console.error('Error toggling link:', error)
    }
  }

  async function handleDelete(linkId: string) {
    if (!window.confirm('Delete this smart link from the dashboard?')) {
      return
    }

    try {
      await linksAPI.delete(linkId)
      await fetchDashboardData()
      setSelectedLinkId((current) => (current === linkId ? null : current))
    } catch (error) {
      console.error('Error deleting link:', error)
    }
  }

  async function handleCopy(linkCode: string, linkId: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/l/${linkCode}`)
      setCopiedLinkId(linkId)
      window.setTimeout(() => setCopiedLinkId(null), 1800)
    } catch (error) {
      console.error('Error copying smart link:', error)
    }
  }

  const normalizedQuery = query.trim().toLowerCase()
  const filteredLinks = links.filter((link) => {
    const searchableText = [
      link.code,
      getLinkTitle(link),
      getHostLabel(link.target_url),
      link.offer_type,
    ]
      .join(' ')
      .toLowerCase()

    const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery)
    if (!matchesQuery) {
      return false
    }

    if (filterMode === 'active') {
      return link.enabled
    }

    if (filterMode === 'paused') {
      return !link.enabled
    }

    if (filterMode === 'converted') {
      return link.conversion_count > 0
    }

    return true
  })

  const backlogLinks = filteredLinks.filter((link) => link.conversion_count === 0 && (!link.enabled || link.click_count === 0))
  const inProgressLinks = filteredLinks.filter((link) => link.conversion_count === 0 && link.enabled && link.click_count > 0)
  const completedLinks = filteredLinks.filter((link) => link.conversion_count > 0)

  const selectedLink =
    filteredLinks.find((link) => link.id === selectedLinkId) ||
    links.find((link) => link.id === selectedLinkId) ||
    pickPreferredLink(filteredLinks) ||
    pickPreferredLink(links) ||
    null

  const chartPoints = dailyAnalytics.length > 0 ? dailyAnalytics.slice(-7) : createFallbackChart(stats)
  const bestPlatform = platformStats[0]

  if (loading && !stats) {
    return (
      <div className="flex min-h-full items-center justify-center p-10 text-white">
        <div className="text-center">
          <Sparkles className="mx-auto mb-4 h-12 w-12 animate-pulse text-sky-400" />
          <p className="text-lg font-medium">Building your workspace...</p>
          <p className="mt-2 text-sm text-white/45">Pulling link activity, revenue, and platform performance.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col text-white">
      <header className="border-b border-white/6 px-4 py-4 md:px-8 md:py-5">
        <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
          <button
            onClick={onToggleSidebar}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Menu size={18} />
          </button>

          <nav className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-2 py-2">
            {['Projects', 'Planning', 'Calendar'].map((item, index) => (
              <button
                key={item}
                className={`rounded-xl px-4 py-2 text-sm transition ${
                  index === 0 ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/80'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="relative min-w-[220px] flex-1 xl:max-w-xl">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-300"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search smart links, offers, or platforms"
              className="h-12 w-full rounded-2xl border border-white/8 bg-[#1d1f27] pl-11 pr-4 text-sm text-white outline-none ring-0 transition placeholder:text-white/30 focus:border-sky-400/40"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NotificationPanel />
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[linear-gradient(180deg,_#4ea4ff,_#2f6aff)] px-5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(41,111,255,0.35)] transition hover:brightness-110"
            >
              <Plus size={16} />
              Add Task
            </button>
            <div className="hidden items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-2 md:flex">
              <div className="h-9 w-9 rounded-full bg-[radial-gradient(circle_at_30%_30%,_#ffd76a,_#4d7dff)]" />
              <div className="leading-tight">
                <p className="text-sm text-white/55">Hey,</p>
                <p className="text-sm font-semibold text-white">Caven</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-7">
        <div className="space-y-6">
          <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="mb-3 text-sm text-white/45">
                Department: <span className="font-semibold text-[#ffb861]">Creative Designers</span>
                <span className="ml-1 text-[#ffd86b]">+</span>
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">Active Tasks</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45 md:text-base">
                Manage recovery links like a project board. Search, filter, pause, relaunch, and inspect high-intent
                offers without leaving the dashboard.
              </p>
            </div>

            {stats && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <SummaryPill label="Recovery Value" value={`$${stats.totalValue.toLocaleString()}`} />
                <SummaryPill label="Conversion Rate" value={`${stats.conversionRate}%`} />
                <SummaryPill label="Live Links" value={stats.activeLinks.toString()} />
                <SummaryPill label="Total Clicks" value={stats.totalClicks.toString()} />
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {([
                ['all', 'All Flow'],
                ['active', 'Live Links'],
                ['paused', 'Paused'],
                ['converted', 'Converted'],
              ] as Array<[FilterMode, string]>).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilterMode(value)}
                  className={`rounded-2xl border px-4 py-2 text-sm transition ${
                    filterMode === value
                      ? 'border-sky-400/35 bg-sky-500/15 text-white'
                      : 'border-white/8 bg-white/5 text-white/45 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:text-white disabled:opacity-60"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                {teams.map((member, index) => (
                  <div
                    key={member.name}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#15161c] bg-gradient-to-br ${member.tint} text-xs font-semibold text-white ${
                      index > 0 ? '-ml-2' : ''
                    }`}
                    title={member.name}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                ))}
                <button className="ml-3 text-sm font-medium text-sky-300 transition hover:text-sky-200">Add +</button>
              </div>

              <div className="flex items-center rounded-2xl border border-white/8 bg-white/5 p-1">
                <button
                  onClick={() => setViewMode('board')}
                  className={`rounded-xl p-2 transition ${viewMode === 'board' ? 'bg-sky-500 text-white' : 'text-white/45'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-xl p-2 transition ${viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-white/45'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </section>

          {viewMode === 'board' ? (
            <section className="grid gap-5 xl:grid-cols-3">
              {laneConfig.map((lane) => {
                const laneLinks =
                  lane.key === 'backlog' ? backlogLinks : lane.key === 'progress' ? inProgressLinks : completedLinks

                return (
                  <div
                    key={lane.key}
                    className="rounded-[1.75rem] border border-white/7 bg-[#1e2028] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${lane.accent}`} />
                          <h2 className="text-lg font-semibold text-white">{lane.title}</h2>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/40">{lane.description}</p>
                      </div>
                      <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-xs text-white/45">
                        {laneLinks.length}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {laneLinks.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/10 px-5 py-8 text-center text-sm text-white/35">
                          No cards in this lane yet.
                        </div>
                      ) : (
                        laneLinks.map((link) => (
                          <TaskCard
                            key={link.id}
                            link={link}
                            selected={selectedLink?.id === link.id}
                            copied={copiedLinkId === link.id}
                            onSelect={() => setSelectedLinkId(link.id)}
                            onCopy={() => handleCopy(link.code, link.id)}
                            onToggle={() => handleToggle(link.id, !link.enabled)}
                            onDelete={() => handleDelete(link.id)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </section>
          ) : (
            <section className="rounded-[1.75rem] border border-white/7 bg-[#1e2028] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">List View</h2>
                  <p className="mt-1 text-sm text-white/40">Scan every link and take action from a single table.</p>
                </div>
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-white/45">
                  {filteredLinks.length} links
                </span>
              </div>
              <LinksList links={filteredLinks} onRefresh={fetchDashboardData} />
            </section>
          )}

          <section className="grid gap-5 2xl:grid-cols-[1.35fr_0.95fr]">
            <div className="rounded-[1.75rem] border border-white/7 bg-[#1e2028] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/45">Selected Card</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {selectedLink ? getLinkTitle(selectedLink) : 'No link selected'}
                  </h3>
                </div>
                {selectedLink && (
                  <button
                    onClick={() => window.open(selectedLink.target_url, '_blank', 'noopener,noreferrer')}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-2 text-sm text-white/65 transition hover:text-white"
                  >
                    Open Target
                    <ExternalLink size={15} />
                  </button>
                )}
              </div>

              {selectedLink ? (
                <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[1.5rem] bg-[linear-gradient(160deg,_rgba(39,44,57,0.96),_rgba(26,28,35,0.88))] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-white/45">{getHostLabel(selectedLink.target_url)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {renderTags(selectedLink).map((tag) => (
                            <span
                              key={tag.label}
                              className={`rounded-full px-3 py-1 text-xs font-medium ${tag.className}`}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button className="rounded-full border border-white/8 bg-white/5 p-2 text-white/40">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <DetailMetric label="Clicks" value={selectedLink.click_count.toString()} />
                      <DetailMetric label="Conversions" value={selectedLink.conversion_count.toString()} />
                      <DetailMetric label="Revenue" value={`$${Number(selectedLink.total_value || 0).toFixed(0)}`} />
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-sm text-white/45">
                        <span>Offer strength</span>
                        <span>{getProgressPercent(selectedLink)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/8">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${getProgressGradient(selectedLink)}`}
                          style={{ width: `${getProgressPercent(selectedLink)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-black/18 p-5">
                    <p className="text-sm text-white/45">Performance Pulse</p>
                    <div className="mt-5 flex h-40 items-end gap-3">
                      {chartPoints.map((point) => {
                        const amount = Number(point.total_value || 0)
                        const barHeight = getBarHeight(chartPoints, amount)

                        return (
                          <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                            <div className="flex h-32 w-full items-end rounded-2xl bg-white/5 px-2 pb-2">
                              <div
                                className="w-full rounded-xl bg-[linear-gradient(180deg,_rgba(82,161,255,0.95),_rgba(63,102,255,0.55))]"
                                style={{ height: `${barHeight}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/35">{formatDay(point.date)}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-sm text-white/45">What to do next</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {getLinkRecommendation(selectedLink)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/10 bg-black/12 px-5 py-12 text-center text-white/35">
                  Select a card from the board to inspect its health, offer mix, and recent momentum.
                </div>
              )}
            </div>

            <div className="grid gap-5">
              <div className="rounded-[1.75rem] border border-white/7 bg-[#1e2028] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/45">Workspace Velocity</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Pipeline Health</h3>
                  </div>
                  <TrendingUp className="text-sky-300" size={20} />
                </div>

                <div className="mt-5 grid gap-3">
                  <VelocityRow label="Backlog" count={backlogLinks.length} tone="bg-white/70" />
                  <VelocityRow label="In Progress" count={inProgressLinks.length} tone="bg-sky-400" />
                  <VelocityRow label="Completed" count={completedLinks.length} tone="bg-emerald-400" />
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-black/18 p-4">
                  <p className="text-sm text-white/45">Revenue Snapshot</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    ${stats?.totalValue.toLocaleString() || '0'}
                  </p>
                  <p className="mt-2 text-sm text-emerald-300">
                    {stats?.totalConversions || 0} completed recoveries across {stats?.totalLinks || 0} links
                  </p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/7 bg-[#1e2028] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/45">Platform Radar</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Where links perform best</h3>
                  </div>
                  <Bell size={18} className="text-white/35" />
                </div>

                {bestPlatform ? (
                  <>
                    <div className="mt-5 rounded-[1.5rem] bg-[linear-gradient(160deg,_rgba(39,44,57,0.96),_rgba(26,28,35,0.88))] p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8 text-3xl">
                          {bestPlatform.platform_icon}
                        </div>
                        <div>
                          <p className="text-sm text-white/45">Top converting platform</p>
                          <h4 className="text-xl font-semibold text-white">{bestPlatform.platform_name}</h4>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <DetailMetric label="Links" value={bestPlatform.link_count.toString()} />
                        <DetailMetric label="Clicks" value={bestPlatform.total_clicks.toString()} />
                        <DetailMetric
                          label="Revenue"
                          value={`$${Number(bestPlatform.total_value || 0).toFixed(0)}`}
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {platformStats.slice(0, 4).map((platform) => (
                        <div
                          key={platform.platform}
                          className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{platform.platform_icon}</span>
                            <div>
                              <p className="font-medium text-white">{platform.platform_name}</p>
                              <p className="text-xs text-white/40">
                                {platform.total_conversions} conversions / {platform.total_clicks} clicks
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-sky-300">
                            {Number(platform.avg_conversion_rate || 0).toFixed(2)}x
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/10 bg-black/12 px-5 py-10 text-center text-sm text-white/35">
                    Platform performance will appear once your links start collecting clicks.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {showCreateModal && (
        <CreateLinkModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchDashboardData()
          }}
        />
      )}
    </div>
  )
}

function TaskCard({
  link,
  selected,
  copied,
  onSelect,
  onCopy,
  onToggle,
  onDelete,
}: {
  link: DashboardLink
  selected: boolean
  copied: boolean
  onSelect: () => void
  onCopy: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <article
      onClick={onSelect}
      className={`cursor-pointer rounded-[1.6rem] border p-4 transition ${
        selected
          ? 'border-sky-400/40 bg-[linear-gradient(160deg,_rgba(54,62,80,0.98),_rgba(32,35,46,0.96))] shadow-[0_24px_44px_rgba(9,14,24,0.34)]'
          : 'border-white/6 bg-[linear-gradient(160deg,_rgba(44,47,59,0.98),_rgba(32,34,43,0.96))] hover:border-white/12 hover:bg-[linear-gradient(160deg,_rgba(49,53,66,0.98),_rgba(36,38,48,0.96))]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[1.65rem] font-medium leading-tight text-white">{getLinkTitle(link)}</h3>
          <p className="mt-1 text-sm text-sky-300">{getHostLabel(link.target_url)}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
          }}
          className="rounded-full border border-white/8 bg-white/5 p-2 text-white/35"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {renderTags(link).map((tag) => (
          <span key={tag.label} className={`rounded-full px-3 py-1 text-xs font-medium ${tag.className}`}>
            {tag.label}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm leading-6 text-white/45">
        {link.enabled
          ? 'This recovery path is live and can be optimized with smarter offer timing.'
          : 'Paused links stay in backlog until you relaunch them with a stronger offer.'}
      </p>

      <div className="mt-5 overflow-hidden rounded-[1.35rem] bg-[radial-gradient(circle_at_top,_rgba(86,110,255,0.4),_rgba(18,20,29,0.2)_45%),linear-gradient(135deg,_rgba(24,28,38,1),_rgba(55,61,77,1))] p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">Recovery Pulse</p>
            <p className="mt-2 text-4xl font-semibold text-white">{getProgressPercent(link)}%</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/7 px-3 py-2 text-right">
            <p className="text-xs text-white/35">Conversions</p>
            <p className="text-lg font-semibold text-white">{link.conversion_count}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-white/45">
          <span>{link.click_count} clicks</span>
          <span>${Number(link.total_value || 0).toFixed(0)} revenue</span>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onCopy()
          }}
          className="inline-flex items-center gap-2 text-sky-300"
        >
          <Copy size={14} />
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggle()
          }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:text-white"
        >
          {link.enabled ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
          {link.enabled ? 'Pause' : 'Launch'}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-200 transition hover:bg-red-500/20"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/8 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function VelocityRow({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
        <span className="text-sm text-white/65">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{count}</span>
    </div>
  )
}

function getLinkTitle(link: DashboardLink): string {
  const host = getHostLabel(link.target_url)
  return host === 'Link'
    ? `Smart Link ${link.code.slice(0, 4)}`
    : host
}

function getHostLabel(targetUrl: string): string {
  try {
    const parsed = new URL(targetUrl)
    const host = parsed.hostname.replace('www.', '')
    return host
      .split('.')
      .slice(0, -1)
      .join('.')
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  } catch {
    return 'Link'
  }
}

function renderTags(link: DashboardLink) {
  return [
    {
      label: link.enabled ? 'Live' : 'Paused',
      className: link.enabled ? 'bg-emerald-500/18 text-emerald-200' : 'bg-white/10 text-white/55',
    },
    {
      label: capitalize(link.offer_type),
      className: 'bg-sky-500/16 text-sky-200',
    },
    {
      label: `${link.offer_value}% Offer`,
      className: 'bg-violet-500/16 text-violet-200',
    },
    {
      label: `${link.code.slice(0, 6)}…`,
      className: 'bg-white/8 text-white/45',
    },
  ]
}

function getProgressPercent(link: DashboardLink) {
  if (link.conversion_count > 0) {
    return Math.min(100, 48 + link.conversion_count * 12)
  }

  if (link.click_count > 0) {
    return Math.min(92, 20 + link.click_count * 4)
  }

  return link.enabled ? 18 : 8
}

function getProgressGradient(link: DashboardLink) {
  if (link.conversion_count > 0) {
    return 'from-emerald-300 via-emerald-400 to-teal-500'
  }

  if (link.click_count > 0) {
    return 'from-sky-300 via-sky-400 to-indigo-500'
  }

  return 'from-white/70 to-white/25'
}

function pickPreferredLink(links: DashboardLink[]) {
  return (
    links.find((link) => link.conversion_count > 0) ||
    links.find((link) => link.click_count > 0) ||
    links[0]
  )
}

function createFallbackChart(stats: DashboardStats | null): DailyAnalyticsPoint[] {
  const clicks = stats?.totalClicks || 0
  const revenue = stats?.totalValue || 0
  const conversions = stats?.totalConversions || 0

  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
    date: day,
    total_clicks: Math.max(0, Math.round(clicks / 7 + index * 2)),
    total_conversions: Math.max(0, Math.round(conversions / 7)),
    total_value: Math.max(0, Math.round(revenue / 7 + index * 18)),
  }))
}

function getBarHeight(points: DailyAnalyticsPoint[], value: number) {
  const max = Math.max(...points.map((point) => Number(point.total_value || 0)), 1)
  return Math.max(12, (value / max) * 100)
}

function formatDay(dateValue: string) {
  if (dateValue.length <= 3) {
    return dateValue
  }

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) {
    return dateValue.slice(5)
  }

  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getLinkRecommendation(link: DashboardLink) {
  if (link.conversion_count > 0) {
    return 'This link is already closing. Keep it live, duplicate the offer structure, and route more traffic to the same platform.'
  }

  if (link.click_count > 12) {
    return 'Interest is high but conversions are still soft. Try tightening the recovery message or increasing the offer value slightly.'
  }

  if (link.enabled) {
    return 'The link is live but still gathering signal. Push traffic, monitor click quality, and watch for the first conversion trend.'
  }

  return 'This link is paused or waiting in backlog. Relaunch it with a clearer offer and stronger campaign source before traffic returns.'
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
