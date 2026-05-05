import { db } from '@/server/db'
import { getOptionalUser } from '@/server/auth'
import { error, json } from '@/server/http'
import { getPlatformInfo } from '@/lib/platform-detector'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

interface PlatformStatsRow {
  platform: Parameters<typeof getPlatformInfo>[0]
  link_count: number | string
  total_clicks: number | string
  total_conversions: number | string
  total_value: number | string
  avg_conversion_rate: number | string
}

export async function GET(request: NextRequest) {
  const user = getOptionalUser(request)
  if (!user) {
    return error('Unauthorized: Invalid token', 401)
  }

  try {
    const stats = await db.query(
      `SELECT
        platform,
        COUNT(*) as link_count,
        SUM(click_count) as total_clicks,
        SUM(conversion_count) as total_conversions,
        SUM(total_value) as total_value,
        AVG(CASE WHEN click_count > 0 THEN (conversion_count::float / click_count) ELSE 0 END) as avg_conversion_rate
      FROM smart_links
      WHERE creator_id = $1 AND platform IS NOT NULL
      GROUP BY platform
      ORDER BY total_clicks DESC`,
      [user.id]
    )

    const enrichedStats = (stats.rows as PlatformStatsRow[]).map((row: PlatformStatsRow) => {
      const platformInfo = getPlatformInfo(row.platform)
      return {
        ...row,
        platform_name: platformInfo.name,
        platform_icon: platformInfo.icon,
        platform_color: platformInfo.color,
      }
    })

    return json({
      stats: enrichedStats,
      total_platforms: enrichedStats.length,
    })
  } catch (err) {
    return error((err as Error).message || 'Failed to fetch stats')
  }
}
