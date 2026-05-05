'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Loader } from 'lucide-react'
import axios from 'axios'

interface PlatformStat {
  platform: string
  platform_name: string
  platform_icon: string
  platform_color: string
  link_count: number
  total_clicks: number
  total_conversions: number
  total_value: number
  avg_conversion_rate: number
}

export default function PlatformStats() {
  const [stats, setStats] = useState<PlatformStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlatformStats()
  }, [])

  async function fetchPlatformStats() {
    try {
      setLoading(true)
      const response = await axios.get('/api/links/stats/by-platform')
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error fetching platform stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader size={24} className="text-blue-500 animate-spin" />
      </div>
    )
  }

  if (stats.length === 0) {
    return (
      <div className="bg-slate-900/30 border border-slate-700 rounded-xl p-8 text-center">
        <TrendingUp size={32} className="text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400">No platform data yet. Create links from different platforms to see stats here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Performance by Platform</h3>
      
      <div className="grid gap-4">
        {stats.map((stat) => (
          <div
            key={stat.platform}
            className="bg-gradient-to-r from-slate-900/50 to-slate-800/30 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{stat.platform_icon}</span>
                <div>
                  <h4 className="font-semibold text-white">{stat.platform_name}</h4>
                  <p className="text-sm text-slate-400">{stat.link_count} links</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {((stat.avg_conversion_rate || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-slate-400">conversion rate</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Clicks</p>
                <p className="text-xl font-bold text-white mt-1">{stat.total_clicks || 0}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Conversions</p>
                <p className="text-xl font-bold text-white mt-1">{stat.total_conversions || 0}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Revenue</p>
                <p className="text-xl font-bold text-green-400 mt-1">
                  ${(stat.total_value || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
