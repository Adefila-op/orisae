'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Plus, Copy, ExternalLink, Trash2, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { analyticsAPI, linksAPI } from '@/lib/api-client'

interface Link {
  id: string
  code: string
  target_url: string
  platform?: string
  platform_name?: string
  click_count: number
  conversion_count: number
  total_value: number
  enabled: boolean
  created_at: string
}

interface UserEvent {
  id: string
  link_code: string
  event_type: 'click' | 'conversion' | 'abandoned'
  is_legitimate: boolean
  amount?: number
  timestamp: string
}

export default function KanbanBoard() {
  const [links, setLinks] = useState<Link[]>([])
  const [events, setEvents] = useState<UserEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const dashboard = await analyticsAPI.dashboard() as any
      setLinks(dashboard.links || [])
      setEvents(dashboard.events || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  async function handleCopy(code: string, id: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/l/${code}`)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch (error) {
      console.error('Error copying:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this link?')) return
    try {
      await linksAPI.delete(id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  // Categorize links by result
  const platformTracked = links.filter(l => l.enabled && l.click_count === 0)
  const behavioral = links.filter(l => l.click_count > 0 && l.conversion_count === 0)
  const converted = links.filter(l => l.conversion_count > 0)
  const ignored = events.filter(e => e.event_type === 'abandoned' && !e.is_legitimate)
  const blocked = events.filter(e => e.is_legitimate === false)

  const LinkCard = ({ link, variant = 'default' }: { link: Link; variant?: string }) => (
    <div className="group p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{link.code}</p>
          <p className="text-xs text-white/50 truncate">{link.platform_name || 'Custom'}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => handleCopy(link.code, link.id)}
            className="p-1.5 rounded hover:bg-white/10"
            title={copiedId === link.id ? 'Copied!' : 'Copy link'}
          >
            <Copy size={14} className="text-white/60" />
          </button>
          <button
            onClick={() => handleDelete(link.id)}
            className="p-1.5 rounded hover:bg-red-500/20"
            title="Delete link"
          >
            <Trash2 size={14} className="text-red-400/60" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-white/50">Clicks</span>
          <span className="text-white font-medium">{link.click_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Conversions</span>
          <span className="text-emerald-400 font-medium">{link.conversion_count}</span>
        </div>
        {link.total_value > 0 && (
          <div className="flex justify-between pt-2 border-t border-white/5">
            <span className="text-white/50">Revenue</span>
            <span className="text-blue-400 font-medium">${link.total_value.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  )

  const Lane = ({ title, items, description, icon: Icon, color }: any) => (
    <div className="flex flex-col gap-4 min-h-[600px] flex-1">
      <div className="sticky top-0 z-10 bg-black/30 backdrop-blur pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-xs text-white/40">{description}</p>
          </div>
        </div>
        <div className="text-sm font-semibold text-white/60">{items.length} items</div>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {items.length === 0 ? (
          <div className="flex items-center justify-center p-6 rounded-lg border border-dashed border-white/10">
            <p className="text-sm text-white/30">No items yet</p>
          </div>
        ) : (
          items.map((item: any) => (
            <div key={item.id || item.link_code}>
              <LinkCard link={item} />
            </div>
          ))
        )}
      </div>
    </div>
  )

  if (loading && links.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw size={32} className="mx-auto mb-3 text-white/30 animate-spin" />
          <p className="text-white/50">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-black to-transparent px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Conversion Pipeline</h2>
            <p className="text-sm text-white/40 mt-1">Track links from platform to result</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw size={20} className={`text-white/60 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 p-6 min-w-max">
          {/* Platform Tracked */}
          <div className="w-96">
            <Lane
              title="Platform Tracked"
              items={platformTracked}
              description="Fresh links awaiting clicks"
              icon={Plus}
              color="bg-blue-500/20"
            />
          </div>

          {/* User Behavioral Data */}
          <div className="w-96">
            <Lane
              title="User Behavioral Data"
              items={behavioral}
              description="Links with engagement activity"
              icon={AlertCircle}
              color="bg-amber-500/20"
            />
          </div>

          {/* Result - Converted */}
          <div className="w-96">
            <div className="flex flex-col gap-4 min-h-[600px]">
              <div className="sticky top-0 z-10 bg-black/30 backdrop-blur pb-4">
                <h3 className="font-semibold text-white mb-1">Result</h3>
                <p className="text-xs text-white/40">Final conversion outcomes</p>
              </div>

              {/* Converted Sub-lane */}
              <div className="flex-1 min-h-[280px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <CheckCircle size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-400 text-sm">Converted</p>
                    <p className="text-xs text-white/30">{converted.length} conversions</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {converted.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-white/10 text-center">
                      <p className="text-xs text-white/30">No conversions yet</p>
                    </div>
                  ) : (
                    converted.map(link => <LinkCard key={link.id} link={link} />)
                  )}
                </div>
              </div>

              {/* Ignored Sub-lane */}
              <div className="flex-1 min-h-[280px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-gray-500/20">
                    <AlertCircle size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-400 text-sm">Ignored</p>
                    <p className="text-xs text-white/30">{ignored.length} abandonments</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs p-3 rounded-lg bg-white/3 border border-white/5">
                  {ignored.length === 0 ? (
                    <p className="text-white/30">No abandoned carts</p>
                  ) : (
                    <p className="text-white/50">{ignored.length} users abandoned</p>
                  )}
                </div>
              </div>

              {/* Blocked Sub-lane */}
              <div className="flex-1 min-h-[280px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <XCircle size={16} className="text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-red-400 text-sm">Blocked</p>
                    <p className="text-xs text-white/30">{blocked.length} suspicious</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs p-3 rounded-lg bg-white/3 border border-white/5">
                  {blocked.length === 0 ? (
                    <p className="text-white/30">No blocked events</p>
                  ) : (
                    <p className="text-red-400/70">{blocked.length} bot detections</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
