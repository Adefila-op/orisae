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
    const { link_code, user_address, amount, is_legitimate, conversion_timestamp, order_info } =
      await request.json()

    if (!link_code) {
      return error('link_code is required', 400)
    }

    if (typeof amount !== 'number' || amount < 0 || amount > 999999) {
      return error('Invalid amount', 400)
    }

    const link = await getLinkByCode(link_code)
    if (!link) {
      return error('Link not found', 404)
    }

    const userAgent = request.headers.get('user-agent') || ''
    const clientType = request.headers.get('x-client-type') || ''
    const botPatterns = ['bot', 'crawler', 'spider', 'curl', 'wget', 'python', 'headless']
    const appearsToBeBot = botPatterns.some((pattern) => userAgent.toLowerCase().includes(pattern))

    if (clientType !== 'web' || appearsToBeBot || is_legitimate !== true) {
      return error('Request rejected: bot-like behavior', 403)
    }

    await db.query(
      `INSERT INTO user_events (
        id, link_id, user_address, event_type, intent_signals
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        randomUUID(),
        link.id,
        user_address || null,
        'conversion',
        JSON.stringify({
          amount,
          is_legitimate,
          timestamp: conversion_timestamp,
          order_info: order_info || {},
          user_agent_safe: userAgent.substring(0, 30),
        }),
      ]
    )

    await db.query(
      `UPDATE smart_links
       SET conversion_count = conversion_count + 1,
           total_value = total_value + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [amount, link.id]
    )

    const notificationId = randomUUID()

    await db.query(
      `INSERT INTO notifications (
        id, user_id, type, title, message, data, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        notificationId,
        link.creator_id,
        'conversion',
        'New Sale!',
        `Purchase via ${link.platform || 'Smart Link'} sold for $${Number(amount).toFixed(2)}`,
        JSON.stringify({
          product_name: `Purchase via ${link.platform || 'Smart Link'}`,
          link_code,
          conversion_amount: amount,
        }),
      ]
    )

    return json({
      success: true,
      message: 'Conversion recorded',
      link_id: link.id,
      notification_id: notificationId,
      amount,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return error((err as Error).message || 'Failed to record conversion')
  }
}
