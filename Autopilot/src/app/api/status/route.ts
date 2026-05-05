import { db } from '@/server/db'
import { error, json } from '@/server/http'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await db.query('SELECT NOW()')

    return json({
      api: 'running',
      version: '1.0.0',
      timestamp: new Date(),
      environment: process.env.NODE_ENV,
    })
  } catch (err) {
    return error((err as Error).message || 'Database connection failed', 503)
  }
}
