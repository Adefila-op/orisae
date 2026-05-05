import { db } from '@/server/db'
import { getOptionalUser } from '@/server/auth'
import { error, json } from '@/server/http'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = getOptionalUser(request)
    const { code } = params

    const result = await db.query('SELECT * FROM smart_links WHERE code = $1', [code])
    const link = result.rows[0]

    if (!link) {
      return error('Link not found', 404)
    }

    if (!user || user.id !== link.creator_id) {
      return json({
        code: link.code,
        short_url: link.short_url,
        enabled: link.enabled,
      })
    }

    return json(link)
  } catch (err) {
    return error((err as Error).message || 'Failed to fetch link')
  }
}
