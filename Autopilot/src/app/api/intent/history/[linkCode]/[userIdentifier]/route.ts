import { db } from '@/server/db'
import { error, json } from '@/server/http'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: { linkCode: string; userIdentifier: string } }
) {
  try {
    const { linkCode, userIdentifier } = params
    const linkResult = await db.query('SELECT * FROM smart_links WHERE code = $1', [linkCode])
    const link = linkResult.rows[0]

    if (!link) {
      return error('Link not found', 404)
    }

    const result = await db.query(
      `SELECT * FROM intent_scores
       WHERE link_id = $1 AND user_identifier = $2
       ORDER BY created_at DESC
       LIMIT 10`,
      [link.id, userIdentifier]
    )

    return json(result.rows)
  } catch (err) {
    return error((err as Error).message || 'Failed to fetch intent history')
  }
}
