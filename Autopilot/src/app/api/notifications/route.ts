import { db } from '@/server/db'
import { getOptionalUser } from '@/server/auth'
import { error, json } from '@/server/http'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const user = getOptionalUser(request)
  if (!user) {
    return error('Unauthorized: Invalid token', 401)
  }

  try {
    const limit = Number(new URL(request.url).searchParams.get('limit') || '20')

    const [notificationsResult, unreadCountResult] = await Promise.all([
      db.query(
        `SELECT * FROM notifications
         WHERE user_id = $1
         ORDER BY sent_at DESC
         LIMIT $2`,
        [user.id, limit]
      ),
      db.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
        [user.id]
      ),
    ])

    return json({
      notifications: notificationsResult.rows,
      unreadCount: Number(unreadCountResult.rows[0]?.count || 0),
    })
  } catch (err) {
    return error((err as Error).message || 'Failed to fetch notifications')
  }
}
