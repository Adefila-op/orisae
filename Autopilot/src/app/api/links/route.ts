import { db } from '@/server/db'
import { getOptionalUser } from '@/server/auth'
import { error, json } from '@/server/http'
import { generateLinkCode, getAppUrl } from '@/server/links'
import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const user = getOptionalUser(request)
  if (!user) {
    return error('Unauthorized: Invalid token', 401)
  }

  try {
    const result = await db.query(
      `SELECT * FROM smart_links
       WHERE creator_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    )

    return json(result.rows)
  } catch (err) {
    return error((err as Error).message || 'Failed to fetch links')
  }
}

export async function POST(request: NextRequest) {
  const user = getOptionalUser(request)
  if (!user) {
    return error('Unauthorized: Invalid token', 401)
  }

  try {
    const body = await request.json()
    const { target_url, product_id, offer_type = 'recovery', offer_value = 10 } = body

    if (!target_url) {
      return error('target_url is required', 400)
    }

    const id = randomUUID()
    const code = generateLinkCode()
    const shortUrl = `${getAppUrl()}/l/${code}`

    const result = await db.query(
      `INSERT INTO smart_links (
        id, creator_id, product_id, code, short_url, target_url, offer_type, offer_value, platform
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [id, user.id, product_id || null, code, shortUrl, target_url, offer_type, offer_value, 'custom']
    )

    return json(result.rows[0], { status: 201 })
  } catch (err) {
    return error((err as Error).message || 'Failed to create link')
  }
}
