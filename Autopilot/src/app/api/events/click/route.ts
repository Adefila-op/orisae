import { db } from '@/server/db'
import { error, json } from '@/server/http'
import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

async function getLinkByCode(code: string) {
  const result = await db.query('SELECT * FROM smart_links WHERE code = $1', [code])
  return result.rows[0] || null
}

export async function POST(request: NextRequest) {
  try {
    const {
      link_code,
      browser_info,
      device_type,
      ip_address,
      referrer,
      utm_source,
      utm_campaign,
      utm_medium,
      user_address,
      is_legitimate,
      user_agent_info,
    } = await request.json()

    if (!link_code) {
      return error('link_code is required', 400)
    }

    const link = await getLinkByCode(link_code)
    if (!link) {
      return error('Link not found', 404)
    }

    await db.query(
      `INSERT INTO user_events (
        id, link_id, user_address, event_type, browser_info, device_type,
        ip_address, referrer, utm_source, utm_campaign, utm_medium, intent_signals
      ) VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, '')::inet, $8, $9, $10, $11, $12)`,
      [
        randomUUID(),
        link.id,
        user_address || null,
        'click',
        JSON.stringify({
          ...browser_info,
          user_agent_info,
          is_legitimate,
        }),
        device_type || 'unknown',
        ip_address || null,
        referrer || null,
        utm_source || null,
        utm_campaign || null,
        utm_medium || null,
        JSON.stringify({
          client_type: request.headers.get('x-client-type') || '',
          safe_user_agent: user_agent_info,
        }),
      ]
    )

    if (is_legitimate !== false) {
      await db.query(
        'UPDATE smart_links SET click_count = click_count + 1, updated_at = NOW() WHERE id = $1',
        [link.id]
      )
    }

    return json({
      redirect: link.target_url,
      link_id: link.id,
      offer_type: link.offer_type,
      offer_value: link.offer_value,
    })
  } catch (err) {
    return error((err as Error).message || 'Failed to track click')
  }
}
