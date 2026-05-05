'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { date: 'Mon', clicks: 240, conversions: 24, revenue: 2400 },
  { date: 'Tue', clicks: 340, conversions: 13, revenue: 2210 },
  { date: 'Wed', clicks: 200, conversions: 9, revenue: 2290 },
  { date: 'Thu', clicks: 279, conversions: 39, revenue: 2000 },
  { date: 'Fri', clicks: 189, conversions: 24, revenue: 2181 },
  { date: 'Sat', clicks: 239, conversions: 24, revenue: 2500 },
  { date: 'Sun', clicks: 349, conversions: 39, revenue: 2100 },
]

export default function AnalyticsChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
          }}
        />
        <Bar dataKey="clicks" fill="#3b82f6" />
        <Bar dataKey="conversions" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  )
}
