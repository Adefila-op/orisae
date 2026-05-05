'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, Zap, Link2, RefreshCw } from 'lucide-react'
import { analyticsAPI } from '@/lib/api-client'
import StatCard from './StatCard'
import LinksList from './LinksList'
import AnalyticsChart from './AnalyticsChart'
import CreateLinkModal from './CreateLinkModal'
import LinkGenerator from '../LinkGenerator'
import PlatformStats from '../PlatformStats'

interface DashboardStats {
  totalLinks: number
  activeLinks: number
  totalClicks: number
  totalConversions: number
  totalValue: number
  conversionRate: string
}

interface DashboardResponse {
  summary: DashboardStats & {
    totalValue: number | string
  }
  links: DashboardLink[]
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
}

export default function DashboardMain() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [links, setLinks] = useState<DashboardLink[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const data = (await analyticsAPI.dashboard()) as DashboardResponse
      
      setStats({
        totalLinks: data.summary.totalLinks || 0,
        activeLinks: data.summary.activeLinks || 0,
        totalClicks: data.summary.totalClicks || 0,
        totalConversions: data.summary.totalConversions || 0,
        totalValue: parseFloat(String(data.summary.totalValue)) || 0,
        conversionRate: data.summary.conversionRate || '0',
      })
      
      setLinks(data.links || [])
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      // Fallback to empty state
      setStats({
        totalLinks: 0,
        activeLinks: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalValue: 0,
        conversionRate: '0',
      })
      setLinks([])
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  const handleLinkCreated = () => {
    setShowCreateModal(false)
    handleRefresh()
  }

  const handleLinkUpdated = () => {
    handleRefresh()
  }

  if (loading && !stats) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Track your conversion recovery metrics in real-time</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-blue-500 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition transform hover:scale-105"
          >
            + Create Link
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Link2}
            label="Total Links"
            value={stats.totalLinks.toString()}
            subtext={`${stats.activeLinks} active`}
          />
          <StatCard
            icon={Zap}
            label="Total Clicks"
            value={stats.totalClicks.toString()}
            subtext="Last 30 days"
          />
          <StatCard
            icon={TrendingUp}
            label="Conversions"
            value={stats.totalConversions.toString()}
            subtext={`${stats.conversionRate}% rate`}
          />
          <StatCard
            icon={DollarSign}
            label="Recovery Value"
            value={`$${stats.totalValue.toLocaleString()}`}
            subtext="Total revenue"
          />
        </div>
      )}

      {/* Link Generator Section */}
      <div>
        <LinkGenerator />
      </div>

      {/* Platform Stats Section */}
      <div className="border border-slate-700 rounded-xl p-6 bg-slate-900/50">
        <PlatformStats />
      </div>

      {/* Analytics Chart */}
      <div className="border border-slate-700 rounded-xl p-6 bg-slate-900/50">
        <h2 className="text-xl font-bold mb-4">Performance Over Time</h2>
        <AnalyticsChart />
      </div>

      {/* Links Table */}
      <div className="border border-slate-700 rounded-xl p-6 bg-slate-900/50">
        <h2 className="text-xl font-bold mb-4">Your Smart Links</h2>
        <LinksList links={links} onRefresh={fetchDashboardData} />
      </div>

      {/* Create Link Modal */}
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
