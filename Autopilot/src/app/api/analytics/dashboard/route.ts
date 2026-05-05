import { db } from '@/server/db'
import { getOptionalUser } from '@/server/auth'
import { error, json } from '@/server/http'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

interface DashboardLinkRow {
  enabled: boolean
  click_count: number | string | null
  conversion_count: number | string | null
  total_value: number | string | null
}

export async function GET(request: NextRequest) {
  const user = getOptionalUser(request)
  if (!user) {
    return error('Unauthorized: Invalid token', 401)
  }

  try {
    const linksResult = await db.query('SELECT * FROM smart_links WHERE creator_id = $1', [user.id])
    const links = linksResult.rows as DashboardLinkRow[]

    const totalClicks = links.reduce((sum: number, link: DashboardLinkRow) => sum + Number(link.click_count || 0), 0)
    const totalConversions = links.reduce(
      (sum: number, link: DashboardLinkRow) => sum + Number(link.conversion_count || 0),
      0
    )
    const totalValue = links.reduce((sum: number, link: DashboardLinkRow) => sum + Number(link.total_value || 0), 0)

    const analyticsResult = await db.query(
      `SELECT * FROM daily_analytics
       WHERE creator_id = $1
       ORDER BY date DESC
       LIMIT 30`,
      [user.id]
    )

    return json({
      summary: {
        totalLinks: links.length,
        activeLinks: links.filter((link) => link.enabled).length,
        totalClicks,
        totalConversions,
        totalValue: totalValue.toFixed(2),
        conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0',
      },
      links,
      dailyAnalytics: analyticsResult.rows,
    })
  } catch (err) {
    return error((err as Error).message || 'Failed to fetch analytics')
  }
}
