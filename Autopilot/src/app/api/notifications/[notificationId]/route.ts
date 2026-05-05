import { db } from '@/server/db'
import { getOptionalUser } from '@/server/auth'
import { error, json } from '@/server/http'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function DELETE(
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
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, user.id]
    )

    if (!result.rowCount) {
      return error('Notification not found', 404)
    }

    return json({ success: true })
  } catch (err) {
    return error((err as Error).message || 'Failed to delete notification')
  }
}
