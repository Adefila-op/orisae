import { Worker } from 'bullmq'
import { db, redis } from '../server'
import { v4 as uuidv4 } from 'uuid'

interface NotificationJob {
  notification_id: string
  type: 'conversion' | 'abandoned_cart' | 'new_lead' | 'offer_accepted'
  user_id: string
}

async function processNotificationJob(job: any): Promise<void> {
  const jobData: NotificationJob = job.data

  try {
    console.log(`\nProcessing notification: ${job.id}`)
    console.log(`   Type: ${jobData.type}`)
    console.log(`   User: ${jobData.user_id}`)

    const notificationResult = await db.query(
      `SELECT id, user_id, type, title, message, data
       FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [jobData.notification_id, jobData.user_id]
    )

    if (notificationResult.rows.length === 0) {
      throw new Error(`Notification not found: ${jobData.notification_id}`)
    }

    const notification = notificationResult.rows[0]

    const userResult = await db.query(
      'SELECT id, email, wallet_address, subscribed_to_notifications FROM users WHERE id = $1',
      [notification.user_id]
    )

    if (userResult.rows.length === 0) {
      throw new Error(`User not found: ${notification.user_id}`)
    }

    const user = userResult.rows[0]
    if (!user.subscribed_to_notifications) {
      console.log('   Notifications disabled, skipping')
      return
    }

    if (user.email) {
      const existingEmail = await db.query(
        'SELECT id FROM email_queue WHERE notification_id = $1 LIMIT 1',
        [notification.id]
      )

      if (existingEmail.rows.length === 0) {
        const emailQueueId = uuidv4()
        const templateMap: Record<string, string> = {
          conversion: 'conversion_notification',
          abandoned_cart: 'abandoned_cart',
          new_lead: 'offer_alert',
          offer_accepted: 'offer_alert',
        }

        const template = templateMap[jobData.type] || 'offer_alert'
        const notificationData = notification.data || {}

        await db.query(
          `INSERT INTO email_queue (
            id, user_id, recipient_email, notification_id, template, data, status, retry_count, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', 0, NOW())`,
          [
            emailQueueId,
            notification.user_id,
            user.email,
            notification.id,
            template,
            JSON.stringify({
              subject: notification.title,
              ...notificationData,
            }),
          ]
        )

        const { emailQueue } = await import('../server')
        await emailQueue.add(
          'send-email',
          {
            user_id: notification.user_id,
            recipient_email: user.email,
            notification_id: notification.id,
            template,
            data: {
              subject: notification.title,
              ...notificationData,
            },
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          }
        )
      }
    }

    console.log('Notification processed successfully')
    console.log(`   Title: ${notification.title}`)
    console.log(`   Message: ${notification.message}`)
  } catch (error: any) {
    console.error(`Notification job ${job.id} failed:`, error.message)
    throw error
  }
}

export async function startNotificationWorker() {
  const notificationWorker = new Worker('notifications', processNotificationJob, {
    connection: redis,
    concurrency: 3,
  })

  notificationWorker.on('completed', (job) => {
    console.log(`Notification worker: Job ${job.id} completed`)
  })

  notificationWorker.on('failed', (job, error) => {
    console.error(`Notification worker: Job ${job?.id} failed - ${error.message}`)
  })

  notificationWorker.on('error', (error) => {
    console.error('Notification worker error:', error)
  })

  console.log('Notification worker started')

  return notificationWorker
}

export default startNotificationWorker
