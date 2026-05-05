'use client'

import { useState } from 'react'

export default function LinksPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Smart Links</h1>
        <p className="text-slate-400">Manage all your trackable product links</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Coming Soon */}
      <div className="border border-slate-700 rounded-xl p-12 text-center bg-slate-900/50">
        <div className="text-6xl mb-4">🔗</div>
        <h2 className="text-2xl font-bold mb-2">Smart Links Manager</h2>
        <p className="text-slate-400">Full link management interface coming soon</p>
      </div>
    </div>
  )
}
