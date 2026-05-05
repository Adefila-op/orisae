/**
 * Link Generator Route
 * Handles creating smart links from product URLs with platform detection
 */

import { Router, Response } from 'express'
import linkService from '../services/link-service'
import { detectPlatform, getPlatformInfo, isValidUrl } from '../utils/platform-detector'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { db } from '../server'

const router = Router()

/**
 * POST /api/links/generate
 * Generate a trackable smart link from a product URL
 * 
 * Body:
 * {
 *   "product_url": "https://gumroad.com/...",
 *   "offer_type": "recovery",
 *   "offer_value": 10
 * }
 */
router.post('/generate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { product_url, offer_type = 'recovery', offer_value = 10 } = req.body
    const creator_id = (req as any).user?.id

    if (!creator_id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!product_url) {
      return res.status(400).json({ error: 'product_url is required' })
    }

    // Validate URL format
    if (!isValidUrl(product_url)) {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // Detect platform
    const detection = detectPlatform(product_url)

    // Create smart link
    const link = await linkService.createLink(
      creator_id,
      product_url,
      undefined,
      offer_type,
      offer_value,
      product_url,
      detection.platform
    )

    // Return response with platform info
    const platformInfo = getPlatformInfo(detection.platform)

    return res.json({
      success: true,
      link: {
        ...link,
        platform_name: platformInfo.name,
        platform_icon: platformInfo.icon,
        platform_color: platformInfo.color,
        detection_confidence: detection.confidence,
      },
    })
  } catch (error) {
    console.error('Error generating link:', error)
    res.status(500).json({ error: 'Failed to generate link' })
  }
})

/**
 * GET /api/links/platforms
 * Get list of supported platforms
 */
router.get('/platforms', (_req, res: Response) => {
  const platforms = [
    { value: 'gumroad', label: 'Gumroad', icon: '📦' },
    { value: 'stripe', label: 'Stripe', icon: '💳' },
    { value: 'shopify', label: 'Shopify', icon: '🛍️' },
    { value: 'paypal', label: 'PayPal', icon: '💰' },
    { value: 'etsy', label: 'Etsy', icon: '🎨' },
    { value: 'lemonsqueezy', label: 'Lemon Squeezy', icon: '🍋' },
    { value: 'sellfy', label: 'Sellfy', icon: '🏪' },
    { value: 'wix', label: 'Wix', icon: '🌐' },
    { value: 'kajabi', label: 'Kajabi', icon: '📚' },
    { value: 'teachable', label: 'Teachable', icon: '🎓' },
    { value: 'udemy', label: 'Udemy', icon: '📖' },
    { value: 'custom', label: 'Custom URL', icon: '🔗' },
  ]

  res.json({ platforms })
})

/**
 * GET /api/links/by-platform/:platform
 * Get all links for a specific platform
 */
router.get('/by-platform/:platform', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const creator_id = req.user?.id
    const { platform } = req.params

    if (!creator_id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const links = await db.query(
      'SELECT * FROM smart_links WHERE creator_id = $1 AND platform = $2 ORDER BY created_at DESC',
      [creator_id, platform]
    )

    const platformInfo = getPlatformInfo(platform as any)

    res.json({
      platform,
      platform_name: platformInfo.name,
      platform_icon: platformInfo.icon,
      links: links.rows,
      count: links.rows.length,
    })
  } catch (error) {
    console.error('Error fetching platform links:', error)
    res.status(500).json({ error: 'Failed to fetch links' })
  }
})

/**
 * GET /api/links/stats/by-platform
 * Get aggregated stats by platform
 */
router.get('/stats/by-platform', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const creator_id = req.user?.id

    if (!creator_id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const stats = await db.query(
      `SELECT 
        platform,
        COUNT(*) as link_count,
        SUM(click_count) as total_clicks,
        SUM(conversion_count) as total_conversions,
        SUM(total_value) as total_value,
        AVG(CASE WHEN click_count > 0 THEN (conversion_count::float / click_count) ELSE 0 END) as avg_conversion_rate
      FROM smart_links 
      WHERE creator_id = $1 AND platform IS NOT NULL
      GROUP BY platform
      ORDER BY total_clicks DESC`,
      [creator_id]
    )

    const enrichedStats = stats.rows.map((row: any) => {
      const platformInfo = getPlatformInfo(row.platform)
      return {
        ...row,
        platform_name: platformInfo.name,
        platform_icon: platformInfo.icon,
        platform_color: platformInfo.color,
      }
    })

    res.json({
      stats: enrichedStats,
      total_platforms: enrichedStats.length,
    })
  } catch (error) {
    console.error('Error fetching platform stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
