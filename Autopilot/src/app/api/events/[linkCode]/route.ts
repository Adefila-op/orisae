import { db } from '@/server/db'
import { error, json } from '@/server/http'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: { linkCode: string } }
) {
  try {
    const { linkCode } = params
    const linkResult = await db.query('SELECT * FROM smart_links WHERE code = $1', [linkCode])
    const link = linkResult.rows[0]

    if (!link) {
      return error('Link not found', 404)
    }

    const result = await db.query(
      `SELECT * FROM user_events
       WHERE link_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [link.id]
    )

    return json(result.rows)
  } catch (err) {
    return error((err as Error).message || 'Failed to fetch events')
  }
}
