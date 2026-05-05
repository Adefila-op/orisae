import express, { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import notificationService from '../services/notification-service'

const router: Router = express.Router()

// Get user notifications
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || '20', 10)
    const notifications = await notificationService.getUserNotifications(
      req.user!.id,
      limit
    )

    res.json(notifications)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get unread count
router.get('/unread/count', requireAuth, async (req: AuthRequest, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id)
    res.json({ unreadCount: count })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Mark as read
router.patch('/:notification_id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { notification_id } = req.params

    const notification = await notificationService.markAsRead(notification_id)

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json(notification)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Mark all as read
router.patch('/all/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    await notificationService.markAllAsRead(req.user!.id)
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
