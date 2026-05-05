import { db } from '@/server/db'
import { getOptionalUser } from '@/server/auth'
import { error, json } from '@/server/http'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

interface IntentScoreRow {
  purchase_probability: number | string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  const user = getOptionalUser(request)
  if (!user) {
    return error('Unauthorized: Invalid token', 401)
  }

  try {
    const { linkId } = params
    const linkResult = await db.query('SELECT * FROM smart_links WHERE id = $1', [linkId])

    if (linkResult.rows.length === 0) {
      return error('Link not found', 404)
    }

    const link = linkResult.rows[0]
    if (link.creator_id !== user.id) {
      return error('Unauthorized', 403)
    }

    const [eventsResult, scoresResult] = await Promise.all([
      db.query(
        `SELECT * FROM user_events
         WHERE link_id = $1
         ORDER BY created_at DESC`,
        [linkId]
      ),
      db.query(
        `SELECT * FROM intent_scores
         WHERE link_id = $1
         ORDER BY created_at DESC`,
        [linkId]
      ),
    ])

    const intentScores = scoresResult.rows as IntentScoreRow[]

    const avgIntentScore =
      intentScores.length > 0
        ? (
            intentScores.reduce(
              (sum: number, score: IntentScoreRow) => sum + Number(score.purchase_probability || 0),
              0
            ) / intentScores.length
          ).toFixed(2)
        : '0'

    return json({
      link,
      events: eventsResult.rows,
      intentScores: scoresResult.rows,
      summary: {
        clicks: link.click_count,
        conversions: link.conversion_count,
        revenue: link.total_value,
        conversionRate:
          Number(link.click_count) > 0
            ? ((Number(link.conversion_count) / Number(link.click_count)) * 100).toFixed(2)
            : '0',
        avgIntentScore,
      },
    })
  } catch (err) {
    return error((err as Error).message || 'Failed to fetch analytics')
  }
}
