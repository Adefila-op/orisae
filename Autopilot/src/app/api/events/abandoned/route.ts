import { db } from '@/server/db'
import { error, json } from '@/server/http'
import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { link_code, user_address } = await request.json()

    if (!link_code) {
      return error('link_code is required', 400)
    }

    const linkResult = await db.query('SELECT * FROM smart_links WHERE code = $1', [link_code])
    const link = linkResult.rows[0]

    if (!link) {
      return error('Link not found', 404)
    }

    await db.query(
      `INSERT INTO user_events (
        id, link_id, user_address, event_type
      ) VALUES ($1, $2, $3, $4)`,
      [randomUUID(), link.id, user_address || null, 'abandoned']
    )

    return json({ success: true, message: 'Abandon event recorded' })
  } catch (err) {
    return error((err as Error).message || 'Failed to record abandon event')
  }
}
