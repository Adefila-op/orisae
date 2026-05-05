import { db } from '@/server/db'
import { getOptionalUser } from '@/server/auth'
import { error, json } from '@/server/http'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  const user = getOptionalUser(request)
  if (!user) {
    return error('Unauthorized: Invalid token', 401)
  }

  try {
    const { notificationId } = params
    const result = await db.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, user.id]
    )

    if (result.rows.length === 0) {
      return error('Notification not found', 404)
    }

    return json(result.rows[0])
  } catch (err) {
    return error((err as Error).message || 'Failed to mark notification as read')
  }
}
