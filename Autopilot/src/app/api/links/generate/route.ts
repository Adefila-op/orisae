import { db } from '@/server/db'
import { getOptionalUser } from '@/server/auth'
import { error, json } from '@/server/http'
import { generateLinkCode, getAppUrl } from '@/server/links'
import { detectPlatform, getPlatformInfo, isValidUrl } from '@/lib/platform-detector'
import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const user = getOptionalUser(request)
  if (!user) {
    return error('Unauthorized: Invalid token', 401)
  }

  try {
    const { product_url, offer_type = 'recovery', offer_value = 10 } = await request.json()

    if (!product_url) {
      return error('product_url is required', 400)
    }

    if (!isValidUrl(product_url)) {
      return error('Invalid URL format', 400)
    }

    const detection = detectPlatform(product_url)
    const id = randomUUID()
    const code = generateLinkCode()
    const shortUrl = `${getAppUrl()}/l/${code}`

    const result = await db.query(
      `INSERT INTO smart_links (
        id, creator_id, code, short_url, target_url, original_url, platform, offer_type, offer_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [id, user.id, code, shortUrl, product_url, product_url, detection.platform, offer_type, offer_value]
    )

    const platformInfo = getPlatformInfo(detection.platform)

    return json({
      success: true,
      link: {
        ...result.rows[0],
        platform_name: platformInfo.name,
        platform_icon: platformInfo.icon,
        platform_color: platformInfo.color,
        detection_confidence: detection.confidence,
      },
    })
  } catch (err) {
    return error((err as Error).message || 'Failed to generate link')
  }
}
