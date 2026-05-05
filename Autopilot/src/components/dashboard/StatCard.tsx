'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  subtext?: string
}

export default function StatCard({ icon: Icon, label, value, subtext }: StatCardProps) {
  return (
    <div className="border border-slate-700 rounded-xl p-6 bg-slate-900/50 hover:bg-slate-800/50 transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtext && <p className="text-slate-500 text-sm mt-1">{subtext}</p>}
        </div>
        <Icon className="w-8 h-8 text-blue-400 opacity-50" />
      </div>
    </div>
  )
}
