'use client'

import { Copy, Trash2, Eye, Power } from 'lucide-react'
import { useState } from 'react'
import { linksAPI } from '@/lib/api-client'

interface Link {
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

interface LinksListProps {
  links: Link[]
  onRefresh: () => void
}

export default function LinksList({ links, onRefresh }: LinksListProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }

    return process.env.NEXT_PUBLIC_SITE_URL || ''
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleToggle(linkId: string, newState: boolean) {
    try {
      await linksAPI.toggle(linkId, newState)
      onRefresh()
    } catch (error: any) {
      console.error('Error toggling link:', error)
      alert('Failed to toggle link')
    }
  }

  async function handleDelete(linkId: string) {
    if (!confirm('Are you sure you want to delete this link?')) return
    try {
      await linksAPI.delete(linkId)
      onRefresh()
    } catch (error: any) {
      console.error('Error deleting link:', error)
      alert('Failed to delete link')
    }
  }

  const getOfferBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      recovery: 'bg-red-500/20 text-red-300',
      discount: 'bg-green-500/20 text-green-300',
      upsell: 'bg-purple-500/20 text-purple-300',
      bundle: 'bg-blue-500/20 text-blue-300',
    }
    return colors[type] || 'bg-slate-500/20 text-slate-300'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Link Code</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Offer</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Clicks</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Conversions</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Revenue</th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => (
            <tr key={link.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-blue-400">{link.code}</code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${getBaseUrl()}/l/${link.code}`,
                        link.id
                      )
                    }
                    className="p-1 hover:bg-slate-700 rounded transition"
                    title="Copy link"
                  >
                    <Copy size={16} className="text-slate-400" />
                  </button>
                  {copied === link.id && <span className="text-xs text-green-400">Copied!</span>}
                </div>
              </td>
              <td className="py-3 px-4">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${getOfferBadgeColor(link.offer_type)}`}>
                  {link.offer_type} {link.offer_value}%
                </span>
              </td>
              <td className="py-3 px-4 text-right">{link.click_count.toLocaleString()}</td>
              <td className="py-3 px-4 text-right font-semibold">{link.conversion_count}</td>
              <td className="py-3 px-4 text-right font-semibold text-green-400">
                ${link.total_value.toLocaleString()}
              </td>
              <td className="py-3 px-4">
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => window.open(`/dashboard/analytics?link=${link.id}`, '_blank')}
                    className="p-1 hover:bg-slate-700 rounded transition"
                    title="View analytics"
                  >
                    <Eye size={16} className="text-slate-400" />
                  </button>
                  <button 
                    onClick={() => handleToggle(link.id, !link.enabled)}
                    className="p-1 hover:bg-slate-700 rounded transition"
                    title={link.enabled ? 'Disable link' : 'Enable link'}
                  >
                    <Power size={16} className={link.enabled ? 'text-green-400' : 'text-slate-400'} />
                  </button>
                  <button 
                    onClick={() => handleDelete(link.id)}
                    className="p-1 hover:bg-red-500/20 rounded transition"
                    title="Delete link"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {links.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No smart links created yet</p>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition">
            Create Your First Link
          </button>
        </div>
      )}
    </div>
  )
}
