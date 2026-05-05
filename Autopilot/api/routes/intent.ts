import express, { Router } from 'express'
import intentService from '../services/intent-service'
import linkService from '../services/link-service'

const router: Router = express.Router()

// Score user intent for a link
router.post('/score', async (req, res) => {
  try {
    const { link_code, user_identifier } = req.body

    if (!link_code || !user_identifier) {
      return res.status(400).json({ error: 'link_code and user_identifier required' })
    }

    // Get link
    const link = await linkService.getLink(link_code)
    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    // Score intent
    const score = await intentService.scoreUserIntent(
      link.id,
      user_identifier
    )

    res.json(score)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get intent history
router.get('/history/:link_code/:user_identifier', async (req, res) => {
  try {
    const { link_code, user_identifier } = req.params

    const link = await linkService.getLink(link_code)
    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    const history = await intentService.getUserIntentHistory(
      link.id,
      user_identifier
    )

    res.json(history)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
