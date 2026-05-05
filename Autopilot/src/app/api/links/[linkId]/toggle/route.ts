import { db } from '@/server/db'
import { getOptionalUser } from '@/server/auth'
import { error, json } from '@/server/http'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  const user = getOptionalUser(request)
  if (!user) {
    return error('Unauthorized: Invalid token', 401)
  }

  try {
    const { linkId } = params
    const { enabled } = await request.json()

    const existing = await db.query('SELECT creator_id FROM smart_links WHERE id = $1', [linkId])
    if (existing.rows.length === 0) {
      return error('Link not found', 404)
    }

    if (existing.rows[0].creator_id !== user.id) {
      return error('Unauthorized', 403)
    }

    const result = await db.query(
      'UPDATE smart_links SET enabled = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [enabled, linkId]
    )

    return json(result.rows[0])
  } catch (err) {
    return error((err as Error).message || 'Failed to toggle link')
  }
}
