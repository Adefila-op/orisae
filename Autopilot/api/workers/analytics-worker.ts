import { Worker } from 'bullmq'
import { db, redis } from '../server'

/**
 * Analytics Worker - Processes analytics queue and aggregates metrics
 * 
 * Tasks:
 * - Aggregate daily_analytics from user_events
 * - Calculate conversion rates and trends
 * - Update cached metrics in Redis
 * - Scheduled: Hourly aggregation
 */

/**
 * Aggregate analytics for a creator
 */
async function aggregateCreatorAnalytics(creator_id: string, date: string): Promise<void> {
  try {
    console.log(`📊 Aggregating analytics for creator ${creator_id} on ${date}`)

    // Get all smart links for creator
    const linksResult = await db.query(
      `SELECT id FROM smart_links WHERE creator_id = $1`,
      [creator_id]
    )

    const links = linksResult.rows

    let totalClicks = 0
    let totalConversions = 0
    let totalValue = 0
    let topOfferType = 'recovery'
    const offerCounts: Record<string, number> = {}

    // Aggregate metrics per link
    for (const link of links) {
      // Get clicks
      const clicksResult = await db.query(
        `SELECT COUNT(*) as count FROM user_events 
         WHERE link_id = $1 AND event_type = 'click' 
         AND DATE(created_at) = $2`,
        [link.id, date]
      )

      const clicks = parseInt(clicksResult.rows[0].count, 10)
      totalClicks += clicks

      // Get conversions
      const conversionsResult = await db.query(
        `SELECT COUNT(*) as count, SUM(CAST(intent_signals->>'amount' AS DECIMAL)) as total 
         FROM user_events 
         WHERE link_id = $1 AND event_type = 'conversion' 
         AND DATE(created_at) = $2`,
        [link.id, date]
      )

      const conversions = parseInt(conversionsResult.rows[0].count, 10)
      const value = parseFloat(String(conversionsResult.rows[0].total || 0))

      totalConversions += conversions
      totalValue += value

      // Track offer types
      const linkResult = await db.query(
        `SELECT offer_type FROM smart_links WHERE id = $1`,
        [link.id]
      )

      if (linkResult.rows.length > 0) {
        const offerType = linkResult.rows[0].offer_type
        offerCounts[offerType] = (offerCounts[offerType] || 0) + 1
      }
    }

    // Find most common offer type
    if (Object.keys(offerCounts).length > 0) {
      topOfferType = Object.keys(offerCounts).reduce((a, b) =>
        offerCounts[a] > offerCounts[b] ? a : b
      )
    }

    // Calculate average intent score
    const intentResult = await db.query(
      `SELECT AVG(purchase_probability) as avg_intent 
       FROM intent_scores 
       WHERE link_id IN (SELECT id FROM smart_links WHERE creator_id = $1)
       AND DATE(created_at) = $2`,
      [creator_id, date]
    )

    const avgIntent = parseFloat(intentResult.rows[0].avg_intent || 0)

    // Upsert daily_analytics
    await db.query(
      `INSERT INTO daily_analytics (
        creator_id, date, total_clicks, total_conversions, total_value, avg_intent_score, top_offer_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (creator_id, date) 
      DO UPDATE SET 
        total_clicks = $3,
        total_conversions = $4,
        total_value = $5,
        avg_intent_score = $6,
        top_offer_type = $7`,
      [creator_id, date, totalClicks, totalConversions, totalValue, avgIntent, topOfferType]
    )

    // Cache in Redis
    const cacheKey = `analytics:${creator_id}:${date}`
    await redis.setex(
      cacheKey,
      86400, // 24 hour TTL
      JSON.stringify({
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        total_value: totalValue,
        avg_intent_score: avgIntent,
        top_offer_type: topOfferType,
        conversion_rate: totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : '0',
      })
    )

    console.log(`✅ Analytics aggregated for ${creator_id}`)
    console.log(`   Clicks: ${totalClicks}`)
    console.log(`   Conversions: ${totalConversions}`)
    console.log(`   Revenue: $${totalValue.toFixed(2)}`)
    console.log(`   Avg Intent: ${avgIntent.toFixed(1)}`)
  } catch (error: any) {
    console.error(`❌ Failed to aggregate analytics for ${creator_id}:`, error.message)
    throw error
  }
}

/**
 * Process analytics job
 */
async function processAnalyticsJob(job: any): Promise<void> {
  try {
    console.log(`\n📊 Processing analytics job: ${job.id}`)

    const { type, creator_id, date } = job.data

    if (type === 'daily_aggregate') {
      // Aggregate for specific creator and date
      await aggregateCreatorAnalytics(creator_id, date || new Date().toISOString().split('T')[0])
    } else if (type === 'hourly_aggregate') {
      // Aggregate for all creators for today
      const today = new Date().toISOString().split('T')[0]

      const creatorsResult = await db.query(
        `SELECT DISTINCT creator_id FROM smart_links`
      )

      const creators = creatorsResult.rows

      for (const creator of creators) {
        await aggregateCreatorAnalytics(creator.creator_id, today)
      }

      console.log(`✅ Hourly aggregation completed for ${creators.length} creators`)
    } else if (type === 'historical_rebuild') {
      // Rebuild analytics for a date range
      const { start_date, end_date } = job.data

      const creatorsResult = await db.query(
        `SELECT DISTINCT creator_id FROM smart_links`
      )

      const creators = creatorsResult.rows
      let dateObj = new Date(start_date)
      const endDateObj = new Date(end_date)

      while (dateObj <= endDateObj) {
        const dateStr = dateObj.toISOString().split('T')[0]

        for (const creator of creators) {
          await aggregateCreatorAnalytics(creator.creator_id, dateStr)
        }

        dateObj.setDate(dateObj.getDate() + 1)
      }

      console.log(`✅ Historical rebuild completed`)
    }
  } catch (error: any) {
    console.error(`❌ Analytics job ${job.id} failed:`, error.message)
    throw error
  }
}

/**
 * Start analytics worker
 */
export async function startAnalyticsWorker() {
  const analyticsWorker = new Worker('analytics', processAnalyticsJob, {
    connection: redis,
    concurrency: 2,
  })

  analyticsWorker.on('completed', (job) => {
    console.log(`✅ Analytics worker: Job ${job.id} completed`)
  })

  analyticsWorker.on('failed', (job, error) => {
    console.error(`❌ Analytics worker: Job ${job?.id} failed - ${error.message}`)
  })

  analyticsWorker.on('error', (error) => {
    console.error(`❌ Analytics worker error:`, error)
  })

  console.log('🚀 Analytics worker started')

  return analyticsWorker
}

/**
 * Schedule hourly analytics aggregation
 */
export async function scheduleAnalyticsAggregation() {
  const { analyticQueue } = await import('../server')

  // Schedule hourly aggregation
  console.log('⏰ Scheduling hourly analytics aggregation...')

  // Initial run
  await analyticQueue.add(
    'hourly_aggregate',
    { type: 'hourly_aggregate' },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour at minute 0
      },
    }
  )

  console.log('✅ Analytics aggregation scheduled (every hour)')
}

export default startAnalyticsWorker
