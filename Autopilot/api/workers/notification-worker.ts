import { Worker } from 'bullmq'
import { db, redis } from '../server'
import { v4 as uuidv4 } from 'uuid'

/**
 * Notification Worker - Processes notification queue and delivers alerts
 * 
 * Notification types:
 * - conversion: User made a purchase
 * - abandoned_cart: User abandoned their cart
 * - new_lead: High-intent user detected
 * - offer_accepted: User accepted an offer
 */

interface NotificationJob {
  type: 'conversion' | 'abandoned_cart' | 'new_lead' | 'offer_accepted'
  user_id: string
  link_id?: string
  data: {
    title: string
    message: string
    product_name?: string
    amount?: number
    offer_value?: number
    link_code?: string
    [key: string]: any
  }
}

/**
 * Process notification job
 */
async function processNotificationJob(job: any): Promise<void> {
  const jobData: NotificationJob = job.data

  try {
    console.log(`\n🔔 Processing notification: ${job.id}`)
    console.log(`   Type: ${jobData.type}`)
    console.log(`   User: ${jobData.user_id}`)

    // Get user details
    const userResult = await db.query(
      'SELECT id, email, wallet_address, subscribed_to_notifications FROM users WHERE id = $1',
      [jobData.user_id]
    )

    if (userResult.rows.length === 0) {
      throw new Error(`User not found: ${jobData.user_id}`)
    }

    const user = userResult.rows[0]

    // Check if user has notifications enabled
    if (!user.subscribed_to_notifications) {
      console.log(`⏭️  User has notifications disabled, skipping`)
      return
    }

    // Create in-app notification record
    const notificationId = uuidv4()
    const notificationResult = await db.query(
      `INSERT INTO notifications (
        id, user_id, type, title, message, data, read, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      RETURNING id`,
      [
        notificationId,
        jobData.user_id,
        jobData.type,
        jobData.data.title,
        jobData.data.message,
        JSON.stringify(jobData.data),
      ]
    )

    console.log(`✅ Created in-app notification: ${notificationId}`)

    // Queue email notification if user has email
    if (user.email) {
      const emailQueueId = uuidv4()
      const templateMap: Record<string, string> = {
        conversion: 'conversion_notification',
        abandoned_cart: 'abandoned_cart',
        new_lead: 'offer_alert',
        offer_accepted: 'offer_alert',
      }

      const template = templateMap[jobData.type] || 'offer_alert'

      await db.query(
        `INSERT INTO email_queue (
          id, user_id, recipient_email, notification_id, template, data, status, retry_count, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', 0, NOW())`,
        [
          emailQueueId,
          jobData.user_id,
          user.email,
          notificationId,
          template,
          JSON.stringify({
            subject: jobData.data.title,
            ...jobData.data,
          }),
        ]
      )

      console.log(`✅ Queued email notification: ${emailQueueId}`)

      // Also queue to email worker
      const { emailQueue } = await import('../server')
      await emailQueue.add(
        'send-email',
        {
          user_id: jobData.user_id,
          recipient_email: user.email,
          notification_id: notificationId,
          template,
          data: {
            subject: jobData.data.title,
            ...jobData.data,
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

    // Log notification event for analytics
    console.log(`📊 Notification processed successfully`)
    console.log(`   Title: ${jobData.data.title}`)
    console.log(`   Message: ${jobData.data.message}`)
  } catch (error: any) {
    console.error(`❌ Notification job ${job.id} failed:`, error.message)
    throw error
  }
}

/**
 * Start notification worker
 */
export async function startNotificationWorker() {
  const notificationWorker = new Worker('notifications', processNotificationJob, {
    connection: redis,
    concurrency: 3,
  })

  notificationWorker.on('completed', (job) => {
    console.log(`✅ Notification worker: Job ${job.id} completed`)
  })

  notificationWorker.on('failed', (job, error) => {
    console.error(`❌ Notification worker: Job ${job?.id} failed - ${error.message}`)
  })

  notificationWorker.on('error', (error) => {
    console.error(`❌ Notification worker error:`, error)
  })

  console.log('🚀 Notification worker started')

  return notificationWorker
}

export default startNotificationWorker
