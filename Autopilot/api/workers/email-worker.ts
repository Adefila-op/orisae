import { Worker, Queue } from 'bullmq'
import { db, redis } from '../server'
import axios from 'axios'

/**
 * Email Worker - Processes email queue and sends emails via Resend API
 * 
 * Job types:
 * - notification: Send notification email
 * - digest: Send daily digest email
 * - recovery: Send cart recovery email
 */

interface EmailJob {
  user_id: string
  recipient_email: string
  notification_id?: string
  template: 'conversion_notification' | 'offer_alert' | 'daily_digest' | 'abandoned_cart'
  data: {
    subject: string
    title?: string
    message?: string
    link_code?: string
    offer_value?: number
    conversion_amount?: number
    product_name?: string
    total_clicks?: number
    total_conversions?: number
    total_value?: number
    [key: string]: any
  }
}

interface ResendEmailResponse {
  id: string
  from: string
  to: string
  created_at: string
}

// Get Resend API key from environment
const RESEND_API_KEY = process.env.RESEND_API_KEY || 'test_key_autopilot'
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@autopilot.app'
const RESEND_API_URL = 'https://api.resend.com/emails'

/**
 * Generate email HTML based on template
 */
function generateEmailHTML(
  template: EmailJob['template'],
  data: EmailJob['data']
): string {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: 500; }
      .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
      .stat-card { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3B82F6; }
      .stat-label { font-size: 12px; color: #6B7280; text-transform: uppercase; }
      .stat-value { font-size: 24px; font-weight: bold; color: #1F2937; margin-top: 5px; }
      .footer { text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 20px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
      .success { color: #10B981; }
      .warning { color: #F59E0B; }
      .metric { margin: 15px 0; padding: 10px; background: white; border-radius: 6px; }
    </style>
  `

  switch (template) {
    case 'conversion_notification':
      return `
        <!DOCTYPE html>
        <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 New Conversion!</h1>
              </div>
              <div class="content">
                <p>Great news! You just made a sale:</p>
                <div class="metric">
                  <strong class="success">${data.product_name || 'Your Product'}</strong>
                  <p>Amount: <strong>$${data.conversion_amount?.toFixed(2) || '0.00'}</strong></p>
                  <p>Link: <code>${data.link_code || 'N/A'}</code></p>
                </div>
                <p>Total conversions this month: <strong>${data.total_conversions || 0}</strong></p>
                <a href="http://localhost:3000/dashboard" class="button">View Dashboard</a>
                <div class="footer">
                  <p>© 2026 Autopilot • Conversion Recovery Bot</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `

    case 'offer_alert':
      return `
        <!DOCTYPE html>
        <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚡ Hot Lead Detected</h1>
              </div>
              <div class="content">
                <p>${data.message || 'A high-intent user is showing strong purchase signals'}</p>
                <div class="metric">
                  <p><strong>Link:</strong> ${data.link_code || 'N/A'}</p>
                  <p><strong>Recommended Offer:</strong> ${data.offer_value || 15}% discount</p>
                  <p><strong>Product:</strong> ${data.product_name || 'Your Product'}</p>
                </div>
                <p>This user has visited your link multiple times and is showing high purchase intent. Consider reaching out directly!</p>
                <a href="http://localhost:3000/dashboard" class="button">See More Details</a>
                <div class="footer">
                  <p>© 2026 Autopilot • Conversion Recovery Bot</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `

    case 'abandoned_cart':
      return `
        <!DOCTYPE html>
        <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🛒 Cart Recovery</h1>
              </div>
              <div class="content">
                <p>Someone abandoned their purchase! Here's a great opportunity to recover the sale:</p>
                <div class="metric">
                  <p><strong>Product:</strong> ${data.product_name || 'Your Product'}</p>
                  <p><strong>Recovery Offer:</strong> <span class="success">${data.offer_value || 20}% OFF</span></p>
                  <p><strong>Link:</strong> ${data.link_code || 'N/A'}</p>
                </div>
                <p>Send this link to the customer within the next 24 hours for best results.</p>
                <a href="http://localhost:3000/dashboard/links" class="button">Send Recovery Email</a>
                <div class="footer">
                  <p>© 2026 Autopilot • Conversion Recovery Bot</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `

    case 'daily_digest':
      return `
        <!DOCTYPE html>
        <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📊 Daily Report</h1>
              </div>
              <div class="content">
                <p>Here's your daily summary:</p>
                <div class="stats">
                  <div class="stat-card">
                    <div class="stat-label">Total Clicks</div>
                    <div class="stat-value">${data.total_clicks || 0}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Conversions</div>
                    <div class="stat-value">${data.total_conversions || 0}</div>
                  </div>
                </div>
                <div class="metric">
                  <p><strong>Revenue Today:</strong> $${data.total_value?.toFixed(2) || '0.00'}</p>
                  <p><strong>Conversion Rate:</strong> ${data.total_clicks ? ((data.total_conversions || 0) / (data.total_clicks || 1) * 100).toFixed(1) : '0'}%</p>
                </div>
                <a href="http://localhost:3000/dashboard/analytics" class="button">View Full Analytics</a>
                <div class="footer">
                  <p>© 2026 Autopilot • Conversion Recovery Bot</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `

    default:
      return `
        <!DOCTYPE html>
        <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${data.title || 'Autopilot Notification'}</h1>
              </div>
              <div class="content">
                <p>${data.message || 'No message provided'}</p>
                <a href="http://localhost:3000/dashboard" class="button">Go to Dashboard</a>
              </div>
            </div>
          </body>
        </html>
      `
  }
}

/**
 * Send email via Resend API
 */
async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string
): Promise<ResendEmailResponse | null> {
  try {
    // In development/test, log instead of sending
    if (RESEND_API_KEY === 'test_key_autopilot') {
      console.log(`📧 [DEV MODE] Email would be sent to ${to}`)
      console.log(`   Subject: ${subject}`)
      return {
        id: `dev_${Date.now()}`,
        from: FROM_EMAIL,
        to,
        created_at: new Date().toISOString(),
      }
    }

    const response = await axios.post(
      RESEND_API_URL,
      {
        from: FROM_EMAIL,
        to,
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log(`✅ Email sent to ${to}: ${response.data.id}`)
    return response.data
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to}:`, error.response?.data || error.message)
    throw error
  }
}

/**
 * Process email job
 */
async function processEmailJob(job: any): Promise<void> {
  const jobData: EmailJob = job.data

  try {
    console.log(`\n📨 Processing email job: ${job.id}`)
    console.log(`   To: ${jobData.recipient_email}`)
    console.log(`   Template: ${jobData.template}`)

    // Validate required fields
    if (!jobData.recipient_email) {
      throw new Error('recipient_email is required')
    }

    // Generate HTML email
    const html = generateEmailHTML(jobData.template, jobData.data)

    // Send email
    const response = await sendEmailViaResend(
      jobData.recipient_email,
      jobData.data.subject,
      html
    )

    // Update email_queue record with success
    if (jobData.notification_id) {
      await db.query(
        `UPDATE email_queue 
         SET status = 'sent', sent_at = NOW(), retry_count = 0 
         WHERE notification_id = $1`,
        [jobData.notification_id]
      )
    }

    // Update notification as email_sent
    if (jobData.notification_id) {
      await db.query(
        `UPDATE notifications 
         SET email_sent = true, email_sent_at = NOW() 
         WHERE id = $1`,
        [jobData.notification_id]
      )
    }

    console.log(`✅ Email job ${job.id} completed successfully`)
  } catch (error: any) {
    console.error(`❌ Email job ${job.id} failed:`, error.message)

    // Update retry count and mark as failed if max retries exceeded
    const maxRetries = 3
    const newRetryCount = (job.data.retryCount || 0) + 1

    if (jobData.notification_id) {
      if (newRetryCount >= maxRetries) {
        await db.query(
          `UPDATE email_queue 
           SET status = 'failed', last_error = $1, retry_count = $2 
           WHERE notification_id = $3`,
          [error.message, newRetryCount, jobData.notification_id]
        )
      } else {
        await db.query(
          `UPDATE email_queue 
           SET retry_count = $1, last_error = $2 
           WHERE notification_id = $3`,
          [newRetryCount, error.message, jobData.notification_id]
        )
      }
    }

    // Throw to trigger retry
    throw error
  }
}

/**
 * Start email worker
 */
export async function startEmailWorker() {
  const emailWorker = new Worker('emails', processEmailJob, {
    connection: redis,
    concurrency: 5, // Process 5 emails in parallel
  })

  emailWorker.on('completed', (job) => {
    console.log(`✅ Email worker: Job ${job.id} completed`)
  })

  emailWorker.on('failed', (job, error) => {
    console.error(`❌ Email worker: Job ${job?.id} failed - ${error.message}`)
  })

  emailWorker.on('error', (error) => {
    console.error(`❌ Email worker error:`, error)
  })

  console.log('🚀 Email worker started')

  return emailWorker
}

export default startEmailWorker
