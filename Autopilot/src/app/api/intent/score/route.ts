import { db } from '@/server/db'
import { error, json } from '@/server/http'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

function calculateEngagement(events: Array<{ created_at: string; event_type: string; intent_signals: any }>) {
  if (events.length === 0) {
    return 0
  }

  let score = 0
  const uniqueDays = new Set(events.map((event) => new Date(event.created_at).toDateString())).size
  score += Math.min(uniqueDays * 10, 40)

  const clickCount = events.filter((event) => event.event_type === 'click').length
  score += Math.min(clickCount * 5, 30)

  const deepEvents = events.filter(
    (event) => event.event_type === 'view' || event.intent_signals?.detail_viewed
  ).length
  score += Math.min(deepEvents * 8, 30)

  return Math.min(score, 100)
}

function calculatePriceSensitivity(events: Array<{ created_at: string; event_type: string; intent_signals: any }>) {
  if (events.length === 0) {
    return 50
  }

  let score = 50
  const priceChecks = events.filter(
    (event) => event.intent_signals?.price_checked || event.intent_signals?.comparison_viewed
  ).length

  if (priceChecks > 0) {
    score += priceChecks * 10
  }

  const abandonedQuickly = events.some(
    (event) =>
      event.event_type === 'abandoned' &&
      new Date(event.created_at).getTime() - new Date(events[events.length - 1].created_at).getTime() < 60000
  )

  if (abandonedQuickly) {
    score += 20
  }

  return Math.min(score, 100)
}

function calculateUrgency(events: Array<{ created_at: string }>) {
  if (events.length === 0) {
    return 0
  }

  let score = 0
  const now = Date.now()
  const recentEvent = events[0]
  const timeSinceRecent = (now - new Date(recentEvent.created_at).getTime()) / 1000 / 60

  if (timeSinceRecent < 5) score += 40
  else if (timeSinceRecent < 30) score += 25
  else if (timeSinceRecent < 60) score += 10

  const recentVisits = events.filter((event) => {
    const time = (now - new Date(event.created_at).getTime()) / 1000 / 60
    return time < 60
  }).length

  score += Math.min(recentVisits * 5, 40)
  return Math.min(score, 100)
}

function recommendOffer(purchaseProbability: number, priceSensitivity: number, urgencyScore: number) {
  if (purchaseProbability > 70) {
    return { offer_type: 'upsell', offer_value: 0 }
  }

  if (purchaseProbability > 50) {
    if (priceSensitivity > 60) {
      return { offer_type: 'discount', offer_value: 10 }
    }

    return { offer_type: 'bundle', offer_value: 15 }
  }

  if (urgencyScore > 60) {
    return { offer_type: 'recovery', offer_value: 20 }
  }

  if (priceSensitivity > 70) {
    return { offer_type: 'recovery', offer_value: 25 }
  }

  return { offer_type: 'recovery', offer_value: 30 }
}

export async function POST(request: Request) {
  try {
    const { link_code, user_identifier } = await request.json()

    if (!link_code || !user_identifier) {
      return error('link_code and user_identifier required', 400)
    }

    const linkResult = await db.query('SELECT * FROM smart_links WHERE code = $1', [link_code])
    const link = linkResult.rows[0]

    if (!link) {
      return error('Link not found', 404)
    }

    const eventsResult = await db.query(
      `SELECT * FROM user_events
       WHERE link_id = $1 AND user_address = $2
       ORDER BY created_at DESC
       LIMIT 100`,
      [link.id, user_identifier]
    )

    const events = eventsResult.rows
    const engagementScore = calculateEngagement(events)
    const priceSensitivity = calculatePriceSensitivity(events)
    const urgencyScore = calculateUrgency(events)
    const purchaseProbability = Math.min(
      ((engagementScore * 0.4 + urgencyScore * 0.35 + (100 - priceSensitivity) * 0.25) / 100) * 100,
      100
    )
    const offer = recommendOffer(purchaseProbability, priceSensitivity, urgencyScore)
    const scoreId = randomUUID()

    await db.query(
      `INSERT INTO intent_scores (
        id, link_id, user_identifier, engagement_score, price_sensitivity,
        urgency_score, purchase_probability, recommended_offer_type,
        recommended_offer_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (link_id, user_identifier)
      DO UPDATE SET engagement_score = $4, price_sensitivity = $5,
        urgency_score = $6, purchase_probability = $7,
        recommended_offer_type = $8, recommended_offer_value = $9,
        last_evaluated_at = NOW(),
        updated_at = NOW()`,
      [
        scoreId,
        link.id,
        user_identifier,
        engagementScore,
        priceSensitivity,
        urgencyScore,
        purchaseProbability,
        offer.offer_type,
        offer.offer_value,
      ]
    )

    return json({
      id: scoreId,
      link_id: link.id,
      user_identifier,
      engagement_score: engagementScore,
      price_sensitivity: priceSensitivity,
      urgency_score: urgencyScore,
      purchase_probability: purchaseProbability,
      recommended_offer_type: offer.offer_type,
      recommended_offer_value: offer.offer_value,
    })
  } catch (err) {
    return error((err as Error).message || 'Failed to score intent')
  }
}
