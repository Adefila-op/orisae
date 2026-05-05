import { db, notificationQueue } from '../server'
import { v4 as uuidv4 } from 'uuid'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at?: Date
  data?: Record<string, unknown>
}

export class NotificationService {
  async createNotification(
    user_id: string,
    type: string,
    title: string,
    message: string,
    data: Record<string, unknown> = {}
  ): Promise<Notification> {
    const notificationId = uuidv4()
    const result = await db.query(
      `INSERT INTO notifications (
        id, user_id, type, title, message, data, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [notificationId, user_id, type, title, message, JSON.stringify(data)]
    )

    const notification = result.rows[0]

    await notificationQueue.add(
      'process',
      {
        notification_id: notificationId,
        user_id,
        type,
      },
      {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    )

    return notification
  }

  async getUserNotifications(user_id: string, limit: number = 20): Promise<Notification[]> {
    const result = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY sent_at DESC
       LIMIT $2`,
      [user_id, limit]
    )
    return result.rows
  }

  async markAsRead(notification_id: string, user_id: string): Promise<Notification | null> {
    const result = await db.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notification_id, user_id]
    )
    return result.rows[0] || null
  }

  async markAllAsRead(user_id: string): Promise<void> {
    await db.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE user_id = $1 AND read = false`,
      [user_id]
    )
  }

  async getUnreadCount(user_id: string): Promise<number> {
    const result = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
      [user_id]
    )
    return parseInt(result.rows[0].count, 10)
  }

  async deleteNotification(notification_id: string, user_id: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notification_id, user_id]
    )
    return (result.rowCount || 0) > 0
  }

  async notifyConversion(
    creator_id: string,
    link_code: string,
    product_title: string,
    amount: number
  ): Promise<Notification> {
    return this.createNotification(
      creator_id,
      'conversion',
      'New Sale!',
      `${product_title} sold for $${amount.toFixed(2)}`,
      {
        product_name: product_title,
        link_code,
        conversion_amount: amount,
      }
    )
  }

  async notifyAbandonedCart(
    creator_id: string,
    link_code: string,
    product_title: string,
    offer_value: number
  ): Promise<Notification> {
    return this.createNotification(
      creator_id,
      'abandoned_cart',
      'Cart Abandoned',
      `User abandoned cart for ${product_title}. Send ${offer_value}% recovery offer.`,
      {
        product_name: product_title,
        link_code,
        offer_value,
      }
    )
  }

  async notifyHotLead(
    creator_id: string,
    link_code: string,
    product_title: string,
    offer_value: number
  ): Promise<Notification> {
    return this.createNotification(
      creator_id,
      'new_lead',
      'Hot Lead Detected',
      `High-intent user detected for ${product_title}. Recommend ${offer_value}% offer.`,
      {
        product_name: product_title,
        link_code,
        offer_value,
      }
    )
  }

  async notifyOfferAccepted(
    creator_id: string,
    offer_type: string,
    offer_value: number,
    product_title: string,
    amount: number
  ): Promise<Notification> {
    return this.createNotification(
      creator_id,
      'offer_accepted',
      'Offer Accepted!',
      `Your ${offer_type} offer (${offer_value}% off) for ${product_title} was accepted. Sale: $${amount.toFixed(2)}`,
      {
        product_name: product_title,
        offer_type,
        offer_value,
        conversion_amount: amount,
      }
    )
  }
}

export const notificationService = new NotificationService()

export default notificationService
