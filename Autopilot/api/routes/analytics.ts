import express, { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { db } from '../server'

const router: Router = express.Router()

// Get creator dashboard stats
router.get('/dashboard', async (req: any, res) => {
  try {
    const userId = req.user?.id || process.env.DEMO_USER_ID || '550e8400-e29b-41d4-a716-446655440000'

    // Get all links
    const linksResult = await db.query(
      'SELECT * FROM smart_links WHERE creator_id = $1',
      [userId]
    )
    const links = linksResult.rows

    // Get aggregated stats
    const totalClicks = links.reduce((sum: number, l: any) => sum + (l.click_count || 0), 0)
    const totalConversions = links.reduce((sum: number, l: any) => sum + (l.conversion_count || 0), 0)
    const totalValue = links.reduce((sum: number, l: any) => sum + parseFloat(l.total_value || 0), 0)

    // Get daily analytics
    const analyticsResult = await db.query(
      `SELECT * FROM daily_analytics 
       WHERE creator_id = $1 
       ORDER BY date DESC 
       LIMIT 30`,
      [userId]
    )

    res.json({
      summary: {
        totalLinks: links.length,
        activeLinks: links.filter((l: any) => l.enabled).length,
        totalClicks,
        totalConversions,
        totalValue: totalValue.toFixed(2),
        conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0',
      },
      links,
      dailyAnalytics: analyticsResult.rows,
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error.message)
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' })
  }
})

// Get link analytics
router.get('/link/:link_id', async (req: any, res) => {
  try {
    const { link_id } = req.params
    const userId = req.user?.id || process.env.DEMO_USER_ID || '550e8400-e29b-41d4-a716-446655440000'

    // Get link
    const linkResult = await db.query(
      'SELECT * FROM smart_links WHERE id = $1',
      [link_id]
    )

    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' })
    }

    const link = linkResult.rows[0]

    // Get events
    const eventsResult = await db.query(
      `SELECT * FROM user_events 
       WHERE link_id = $1 
       ORDER BY created_at DESC`,
      [link.id]
    )

    // Get intent scores
    const scoresResult = await db.query(
      `SELECT * FROM intent_scores 
       WHERE link_id = $1 
       ORDER BY created_at DESC`,
      [link.id]
    )

    res.json({
      link,
      events: eventsResult.rows,
      intentScores: scoresResult.rows,
      summary: {
        clicks: link.click_count,
        conversions: link.conversion_count,
        revenue: link.total_value,
        conversionRate:
          link.click_count > 0
            ? ((link.conversion_count / link.click_count) * 100).toFixed(2)
            : '0',
        avgIntentScore:
          scoresResult.rows.length > 0
                scoresResult.rows.reduce((sum: number, s: any) => sum + s.purchase_probability, 0) /
                scoresResult.rows.length
              ).toFixed(2)
            : '0',
      },
    })
  } catch (error: any) {
    console.error('Error fetching link analytics:', error.message)
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' })
    res.status(500).json({ error: error.message })
  }
})

export default router
