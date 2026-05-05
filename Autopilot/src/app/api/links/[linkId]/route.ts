import { db } from '@/server/db'
import { getOptionalUser } from '@/server/auth'
import { error, json } from '@/server/http'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  const user = getOptionalUser(request)
  if (!user) {
    return error('Unauthorized: Invalid token', 401)
  }

  try {
    const { linkId } = params
    const result = await db.query(
      'DELETE FROM smart_links WHERE id = $1 AND creator_id = $2',
      [linkId, user.id]
    )

    if (!result.rowCount) {
      return error('Link not found or unauthorized', 404)
    }

    return json({ success: true, message: 'Link deleted' })
  } catch (err) {
    return error((err as Error).message || 'Failed to delete link')
  }
}
