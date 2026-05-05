import express, { Router } from 'express'
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth'
import linkService from '../services/link-service'

const router: Router = express.Router()

// Create a new smart link
router.post('/', async (req: any, res) => {
  try {
    const { target_url, product_id, offer_type = 'recovery', offer_value = 10 } = req.body
    const creator_id = req.user?.id || process.env.DEMO_USER_ID || '550e8400-e29b-41d4-a716-446655440000'

    if (!target_url) {
      return res.status(400).json({ error: 'target_url is required' })
    }

    const link = await linkService.createLink(
      creator_id,
      target_url,
      product_id,
      offer_type,
      offer_value
    )

    res.status(201).json(link)
  } catch (error: any) {
    console.error('Error creating link:', error.message)
    res.status(500).json({ error: error.message || 'Failed to create link' })
  }
})

// Get all links for creator
router.get('/', async (req: any, res) => {
  try {
    const creator_id = req.user?.id || process.env.DEMO_USER_ID || '550e8400-e29b-41d4-a716-446655440000'
    const links = await linkService.getCreatorLinks(creator_id)
    res.json(links)
  } catch (error: any) {
    console.error('Error fetching links:', error.message)
    res.status(500).json({ error: error.message || 'Failed to fetch links' })
  }
})

// Get specific link by code
router.get('/code/:code', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { code } = req.params
    const link = await linkService.getLink(code)

    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    // Check if user owns this link
    if (req.user && req.user.id !== link.creator_id) {
      // Return limited info for public access
      return res.json({
        code: link.code,
        short_url: link.short_url,
        enabled: link.enabled,
      })
    }

    res.json(link)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Toggle link enabled/disabled
router.patch('/:link_id/toggle', async (req: any, res) => {
  try {
    const { link_id } = req.params
    const { enabled } = req.body
    const creator_id = req.user?.id || process.env.DEMO_USER_ID || '550e8400-e29b-41d4-a716-446655440000'

    // Verify ownership (or skip in dev mode)
    const existingLink = await linkService.getLink(link_id)
    if (!existingLink) {
      return res.status(404).json({ error: 'Link not found' })
    }
    
    if (existingLink.creator_id !== creator_id && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const updatedLink = await linkService.toggleLink(link_id, enabled)
    res.json(updatedLink)
  } catch (error: any) {
    console.error('Error toggling link:', error.message)
    res.status(500).json({ error: error.message || 'Failed to toggle link' })
  }
})

// Delete link
router.delete('/:link_id', async (req: any, res) => {
  try {
    const { link_id } = req.params
    const creator_id = req.user?.id || process.env.DEMO_USER_ID || '550e8400-e29b-41d4-a716-446655440000'
    const deleted = await linkService.deleteLink(link_id, creator_id)

    if (!deleted) {
      return res.status(404).json({ error: 'Link not found or unauthorized' })
    }

    res.json({ success: true, message: 'Link deleted' })
  } catch (error: any) {
    console.error('Error deleting link:', error.message)
    res.status(500).json({ error: error.message || 'Failed to delete link' })
  }
})

export default router
